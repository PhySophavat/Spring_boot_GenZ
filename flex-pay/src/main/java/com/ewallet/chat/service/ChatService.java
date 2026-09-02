package com.ewallet.chat.service;

import com.ewallet.chat.dto.*;
import com.ewallet.chat.entity.*;
import com.ewallet.chat.repository.*;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core chat business logic.
 * Handles all conversation, message, and real-time broadcast operations.
 *
 * Transport security: messages are sent over HTTPS/WSS (configured at the
 * server/reverse-proxy layer). This service stores plaintext message content.
 * Architecture is designed so that future E2EE (client-side encryption)
 * can be layered on top without server-side changes: the server would only
 * store opaque ciphertext payloads.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ChatService {

    private final ConversationRepository    conversationRepository;
    private final MessageRepository         messageRepository;
    private final MessageReadRepository     messageReadRepository;
    private final AttachmentRepository      attachmentRepository;
    private final UserRepository            userRepository;
    private final SimpMessagingTemplate     messagingTemplate;

    private final Tika tika = new Tika();

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.max-size-bytes:10485760}")
    private long maxFileSizeBytes;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // ─────────────────────────────────────────────────────────────────
    // Conversations
    // ─────────────────────────────────────────────────────────────────

    /**
     * Returns all conversations the requesting user participates in,
     * enriched with last message preview and unread count.
     */
    public List<ConversationResponse> getConversationsForUser(Long userId) {
        return conversationRepository.findAllByMemberUserId(userId)
            .stream()
            .map(c -> toConversationResponse(c, userId))
            .collect(Collectors.toList());
    }

    /**
     * Returns a single conversation if the requesting user is a member.
     */
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NoSuchElementException("Conversation not found"));
        assertMember(conv, userId);
        return toConversationResponse(conv, userId);
    }

    /**
     * Creates a DIRECT conversation between the admin and a target user.
     * Returns the existing conversation if one already exists.
     */
    @Transactional
    public ConversationResponse createOrGetDirectConversation(Long adminId, Long targetUserId) {
        // Return existing conversation if it already exists
        Optional<Conversation> existing =
            conversationRepository.findDirectConversationBetween(adminId, targetUserId);
        if (existing.isPresent()) {
            return toConversationResponse(existing.get(), adminId);
        }

        User admin  = userRepository.findById(adminId)
            .orElseThrow(() -> new NoSuchElementException("Admin user not found"));
        User target = userRepository.findById(targetUserId)
            .orElseThrow(() -> new NoSuchElementException("Target user not found"));

        Conversation conv = Conversation.builder().type("DIRECT").build();
        conv = conversationRepository.save(conv);

        ConversationMember adminMember  = ConversationMember.builder()
            .conversation(conv).user(admin).build();
        ConversationMember targetMember = ConversationMember.builder()
            .conversation(conv).user(target).build();

        conv.getMembers().add(adminMember);
        conv.getMembers().add(targetMember);
        conv = conversationRepository.save(conv);

        return toConversationResponse(conv, adminId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────────────────────────

    /**
     * Returns paginated messages for a conversation (newest first, then reversed by frontend).
     */
    public Page<MessageResponse> getMessages(Long conversationId, Long userId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NoSuchElementException("Conversation not found"));
        assertMember(conv, userId);

        return messageRepository
            .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
            .map(this::toMessageResponse);
    }

    /**
     * Sends a message, saves it to the DB, then broadcasts it to the conversation topic.
     */
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest req, Long senderId) {
        Conversation conv = conversationRepository.findById(req.getConversationId())
            .orElseThrow(() -> new NoSuchElementException("Conversation not found"));
        assertMember(conv, senderId);

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new NoSuchElementException("Sender not found"));

        Message.MessageBuilder builder = Message.builder()
            .conversation(conv)
            .sender(sender)
            .content(req.getContent())
            .messageType(req.getMessageType() != null ? req.getMessageType() : "TEXT");

        if (req.getReplyToMessageId() != null) {
            Message replyTo = messageRepository.findById(req.getReplyToMessageId())
                .orElseThrow(() -> new NoSuchElementException("Reply-to message not found"));
            builder.replyToMessage(replyTo);
        }

        Message message = messageRepository.save(builder.build());

        // Attach file if provided
        if (req.getFileUrl() != null) {
            Attachment attachment = Attachment.builder()
                .message(message)
                .fileName(req.getFileName())
                .fileUrl(req.getFileUrl())
                .fileType(req.getFileType())
                .fileSize(req.getFileSize())
                .build();
            attachmentRepository.save(attachment);
            message.getAttachments().add(attachment);
        }

        // Update conversation's updatedAt for sidebar ordering
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        MessageResponse response = toMessageResponse(message);

        // Broadcast to all conversation members via WebSocket
        messagingTemplate.convertAndSend(
            "/topic/conversation." + conv.getId() + ".messages",
            response
        );

        return response;
    }

    /**
     * Edits an existing message. Only the original sender may edit.
     */
    @Transactional
    public MessageResponse editMessage(Long messageId, String newContent, Long requesterId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new NoSuchElementException("Message not found"));

        if (!message.getSender().getId().equals(requesterId)) {
            throw new SecurityException("You can only edit your own messages");
        }
        if (message.getIsDeleted()) {
            throw new IllegalStateException("Cannot edit a deleted message");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message = messageRepository.save(message);

        MessageResponse response = toMessageResponse(message);
        messagingTemplate.convertAndSend(
            "/topic/conversation." + message.getConversation().getId() + ".messages.edited",
            response
        );
        return response;
    }

    /**
     * Soft-deletes a message. Only the sender or an admin may delete.
     */
    @Transactional
    public MessageResponse deleteMessage(Long messageId, Long requesterId, boolean isAdmin) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new NoSuchElementException("Message not found"));

        if (!isAdmin && !message.getSender().getId().equals(requesterId)) {
            throw new SecurityException("You can only delete your own messages");
        }

        message.setIsDeleted(true);
        message.setContent(null);
        message = messageRepository.save(message);

        MessageResponse response = toMessageResponse(message);
        messagingTemplate.convertAndSend(
            "/topic/conversation." + message.getConversation().getId() + ".messages.deleted",
            response
        );
        return response;
    }

    /**
     * Marks a message as read by the requesting user.
     * Broadcasts the read event to the conversation topic.
     */
    @Transactional
    public void markMessageRead(Long messageId, Long userId) {
        if (messageReadRepository.existsByMessageIdAndUserId(messageId, userId)) {
            return; // Already read — idempotent
        }
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new NoSuchElementException("Message not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User not found"));

        MessageRead read = MessageRead.builder()
            .message(message)
            .user(user)
            .build();
        messageReadRepository.save(read);

        // Broadcast read receipt
        messagingTemplate.convertAndSend(
            "/topic/conversation." + message.getConversation().getId() + ".read",
            Map.of("messageId", messageId, "userId", userId, "readAt", LocalDateTime.now().toString())
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // User search
    // ─────────────────────────────────────────────────────────────────

    public List<ConversationResponse.MemberInfo> searchUsers(String keyword) {
        return userRepository.findAll().stream()
            .filter(u -> u.getFullName() != null &&
                         u.getFullName().toLowerCase().contains(keyword.toLowerCase()))
            .map(u -> ConversationResponse.MemberInfo.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .profileImage(u.getProfileImage())
                .role(u.getRole())
                .onlineStatus("OFFLINE")
                .build())
            .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────
    // File Upload
    // ─────────────────────────────────────────────────────────────────

    /**
     * Validates and stores an uploaded file.
     * MIME type is detected server-side via Apache Tika — the client-provided
     * content-type is never trusted.
     *
     * @return publicly accessible URL path for the stored file
     */
    @Transactional
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException(
                "File size exceeds maximum allowed size of " + (maxFileSizeBytes / 1024 / 1024) + " MB");
        }

        // Server-side MIME detection — never trust the client-provided content-type
        String detectedMime = tika.detect(file.getInputStream());
        if (!ALLOWED_MIME_TYPES.contains(detectedMime)) {
            throw new IllegalArgumentException(
                "File type not allowed. Supported: JPG, PNG, WEBP, PDF, DOCX. Detected: " + detectedMime);
        }

        // Sanitize filename — strip path separators and use a UUID prefix
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "file");
        String safeName = Paths.get(originalName).getFileName().toString()
            .replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "_" + safeName;

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Path targetPath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/api/admin/chat/files/" + storedName;

        return Map.of(
            "fileName",  safeName,
            "fileUrl",   fileUrl,
            "fileType",  detectedMime,
            "fileSize",  file.getSize()
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Online status
    // ─────────────────────────────────────────────────────────────────

    /**
     * Broadcasts a user's online/offline status change to all subscribers.
     * Called on WebSocket CONNECT and DISCONNECT.
     */
    public void broadcastUserStatus(Long userId, String status) {
        UserStatusEvent event = UserStatusEvent.builder()
            .userId(userId)
            .status(status)
            .lastSeen(LocalDateTime.now())
            .build();
        messagingTemplate.convertAndSend("/topic/users.status", event);
    }

    // ─────────────────────────────────────────────────────────────────
    // Mappers
    // ─────────────────────────────────────────────────────────────────

    private ConversationResponse toConversationResponse(Conversation conv, Long requestingUserId) {
        List<ConversationResponse.MemberInfo> members = conv.getMembers().stream()
            .map(m -> ConversationResponse.MemberInfo.builder()
                .id(m.getUser().getId())
                .fullName(m.getUser().getFullName())
                .profileImage(m.getUser().getProfileImage())
                .role(m.getUser().getRole())
                .onlineStatus("OFFLINE") // real status injected by WS event on frontend
                .build())
            .collect(Collectors.toList());

        // Last message preview (most recent, not deleted)
        List<Message> msgs = conv.getMessages();
        Message lastMsg = msgs.stream()
            .filter(m -> !m.getIsDeleted())
            .max(Comparator.comparing(Message::getCreatedAt))
            .orElse(null);

        int unreadCount = (int) messageRepository
            .countUnreadMessages(conv.getId(), requestingUserId);

        return ConversationResponse.builder()
            .id(conv.getId())
            .type(conv.getType())
            .members(members)
            .lastMessage(lastMsg != null ? toMessageResponse(lastMsg) : null)
            .unreadCount(unreadCount)
            .createdAt(conv.getCreatedAt())
            .updatedAt(conv.getUpdatedAt())
            .build();
    }

    public MessageResponse toMessageResponse(Message msg) {
        MessageResponse.SenderInfo senderInfo = MessageResponse.SenderInfo.builder()
            .id(msg.getSender().getId())
            .fullName(msg.getSender().getFullName())
            .profileImage(msg.getSender().getProfileImage())
            .role(msg.getSender().getRole())
            .build();

        List<MessageResponse.AttachmentInfo> attachments = msg.getAttachments().stream()
            .map(a -> MessageResponse.AttachmentInfo.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .fileUrl(a.getFileUrl())
                .fileType(a.getFileType())
                .fileSize(a.getFileSize())
                .build())
            .collect(Collectors.toList());

        List<Long> readByUserIds = msg.getReads().stream()
            .map(r -> r.getUser().getId())
            .collect(Collectors.toList());

        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
            .id(msg.getId())
            .conversationId(msg.getConversation().getId())
            .sender(senderInfo)
            .content(msg.getIsDeleted() ? null : msg.getContent())
            .messageType(msg.getMessageType())
            .isEdited(msg.getIsEdited())
            .isDeleted(msg.getIsDeleted())
            .createdAt(msg.getCreatedAt())
            .updatedAt(msg.getUpdatedAt())
            .attachments(attachments)
            .readByUserIds(readByUserIds);

        if (msg.getReplyToMessage() != null) {
            builder.replyToMessageId(msg.getReplyToMessage().getId());
            // Shallow reply preview (no infinite recursion)
            Message reply = msg.getReplyToMessage();
            builder.replyToMessage(MessageResponse.builder()
                .id(reply.getId())
                .content(reply.getIsDeleted() ? null : reply.getContent())
                .isDeleted(reply.getIsDeleted())
                .sender(MessageResponse.SenderInfo.builder()
                    .id(reply.getSender().getId())
                    .fullName(reply.getSender().getFullName())
                    .build())
                .build());
        }

        if ("PAYMENT".equals(msg.getMessageType()) && msg.getContent() != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(msg.getContent());
                MessageResponse.PaymentInfo paymentInfo = MessageResponse.PaymentInfo.builder()
                    .paymentId(node.has("paymentId") ? node.get("paymentId").asLong() : null)
                    .amount(node.has("amount") ? new java.math.BigDecimal(node.get("amount").asText()) : null)
                    .status(node.has("status") ? node.get("status").asText() : "COMPLETED")
                    .message(node.has("message") ? node.get("message").asText() : "")
                    .senderId(node.has("senderId") ? node.get("senderId").asLong() : null)
                    .senderName(node.has("senderName") ? node.get("senderName").asText() : null)
                    .receiverId(node.has("receiverId") ? node.get("receiverId").asLong() : null)
                    .receiverName(node.has("receiverName") ? node.get("receiverName").asText() : null)
                    .transactionReference(node.has("transactionReference") ? node.get("transactionReference").asText() : null)
                    .build();
                builder.paymentInfo(paymentInfo);
            } catch (Exception e) {
                log.warn("Could not parse payment info from message {}: {}", msg.getId(), e.getMessage());
            }
        }

        return builder.build();
    }

    // ─────────────────────────────────────────────────────────────────
    // Guards
    // ─────────────────────────────────────────────────────────────────

    private void assertMember(Conversation conv, Long userId) {
        boolean isMember = conv.getMembers().stream()
            .anyMatch(m -> m.getUser().getId().equals(userId));
        if (!isMember) {
            throw new SecurityException("Access denied: not a member of this conversation");
        }
    }
}
