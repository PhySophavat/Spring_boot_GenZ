package com.ewallet.chat.service;

import com.ewallet.chat.dto.ChatPaymentRequest;
import com.ewallet.chat.dto.ChatPaymentResponse;
import com.ewallet.chat.dto.MessageResponse;
import com.ewallet.chat.entity.Conversation;
import com.ewallet.chat.entity.ConversationMember;
import com.ewallet.chat.entity.Message;
import com.ewallet.chat.repository.ConversationRepository;
import com.ewallet.chat.repository.MessageRepository;
import com.ewallet.notification.entity.Notification;
import com.ewallet.notification.repository.NotificationRepository;
import com.ewallet.payment.entity.PaymentTransaction;
import com.ewallet.payment.repository.PaymentTransactionRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatPaymentServiceImpl implements ChatPaymentService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ChatPaymentResponse processChatPayment(Long senderUserId, ChatPaymentRequest request) {
        log.info("Processing instant chat payment: sender={}, receiver={}, amount={}, conversation={}",
                senderUserId, request.getReceiverId(), request.getAmount(), request.getConversationId());

        // 1. Validate sender
        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        // 2. Validate receiver (by receiverId or receiverName)
        User receiver = null;
        if (request.getReceiverId() != null && request.getReceiverId() > 0) {
            receiver = userRepository.findById(request.getReceiverId()).orElse(null);
        }
        if (receiver == null && request.getReceiverName() != null && !request.getReceiverName().trim().isEmpty()) {
            String name = request.getReceiverName().trim();
            receiver = userRepository.findByPhoneNumber(name)
                    .or(() -> userRepository.findByEmailIgnoreCase(name))
                    .or(() -> userRepository.findAll().stream()
                            .filter(u -> u.getFullName() != null && u.getFullName().equalsIgnoreCase(name))
                            .findFirst())
                    .orElse(null);
        }
        if (receiver == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found");
        }

        if (sender.getId().equals(receiver.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send money to yourself");
        }

        // 3. Validate amount
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a valid amount");
        }

        // 4. Validate conversation & membership (or auto-find/create direct conversation)
        final User finalReceiver = receiver;
        Conversation conv;
        if (request.getConversationId() != null && request.getConversationId() > 0) {
            conv = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
            assertMember(conv, sender.getId(), "Sender is not a member of this conversation");
            assertMember(conv, receiver.getId(), "Receiver is not a member of this conversation");
        } else {
            conv = conversationRepository.findDirectConversationBetween(sender.getId(), receiver.getId())
                    .orElseGet(() -> {
                        Conversation c = Conversation.builder().type("DIRECT").build();
                        c = conversationRepository.save(c);
                        ConversationMember m1 = ConversationMember.builder().conversation(c).user(sender).build();
                        ConversationMember m2 = ConversationMember.builder().conversation(c).user(finalReceiver).build();
                        c.getMembers().add(m1);
                        c.getMembers().add(m2);
                        return conversationRepository.save(c);
                    });
        }

        // 5. Check wallets exist
        Wallet senderWallet = walletRepository.findByUserId(sender.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));

        Wallet receiverWallet = walletRepository.findByUserId(receiver.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        if (!"ACTIVE".equalsIgnoreCase(senderWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender wallet is not active");
        }
        if (!"ACTIVE".equalsIgnoreCase(receiverWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver wallet is not active");
        }

        // 6. Lock wallets in deterministic order to prevent deadlocks
        Wallet firstLock, secondLock;
        if (senderWallet.getId() < receiverWallet.getId()) {
            firstLock = walletRepository.findByUserIdWithLock(sender.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));
            secondLock = walletRepository.findByUserIdWithLock(receiver.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));
        } else {
            firstLock = walletRepository.findByUserIdWithLock(receiver.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));
            secondLock = walletRepository.findByUserIdWithLock(sender.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));
        }

        senderWallet = senderWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;
        receiverWallet = receiverWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;

        // 7. Balance check (Main Wallet)
        if (senderWallet.getUsdBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Insufficient Balance: Your Main Wallet does not have enough money for this payment.");
        }

        // 8. Deduct sender & credit receiver
        senderWallet.setUsdBalance(senderWallet.getUsdBalance().subtract(amount));
        receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));
        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        String txRef = generateReferenceNumber();
        LocalDateTime now = LocalDateTime.now();

        // 9. Record in wallet transactions table
        Transaction walletTx = new Transaction();
        walletTx.setTransactionNo(txRef);
        walletTx.setSenderWallet(senderWallet);
        walletTx.setReceiverWallet(receiverWallet);
        walletTx.setAmount(amount);
        walletTx.setFee(BigDecimal.ZERO);
        walletTx.setTotalAmount(amount);
        walletTx.setNote(request.getMessage() != null && !request.getMessage().trim().isEmpty()
                ? request.getMessage().trim() : "Social payment in chat");
        walletTx.setTransactionType("CHAT_PAYMENT");
        walletTx.setCurrency("USD");
        walletTx.setStatus("SUCCESS");
        transactionRepository.save(walletTx);

        // 10. Record in payment_transactions table
        PaymentTransaction paymentTx = PaymentTransaction.builder()
                .transactionReference(txRef)
                .conversation(conv)
                .sender(sender)
                .receiver(receiver)
                .amount(amount)
                .message(request.getMessage() != null ? request.getMessage().trim() : null)
                .status("COMPLETED")
                .completedAt(now)
                .build();
        paymentTx = paymentTransactionRepository.save(paymentTx);

        // 11. Create chat message of type PAYMENT
        Map<String, Object> paymentDataMap = new LinkedHashMap<>();
        paymentDataMap.put("messageType", "PAYMENT");
        paymentDataMap.put("paymentId", paymentTx.getId());
        paymentDataMap.put("amount", amount.setScale(2, RoundingMode.HALF_UP));
        paymentDataMap.put("status", "COMPLETED");
        paymentDataMap.put("message", request.getMessage() != null ? request.getMessage().trim() : "");
        paymentDataMap.put("senderId", sender.getId());
        paymentDataMap.put("senderName", sender.getFullName());
        paymentDataMap.put("receiverId", receiver.getId());
        paymentDataMap.put("receiverName", receiver.getFullName());
        paymentDataMap.put("transactionReference", txRef);
        paymentDataMap.put("completedAt", now.toString());

        String contentJson;
        try {
            contentJson = objectMapper.writeValueAsString(paymentDataMap);
        } catch (Exception e) {
            log.error("Failed to serialize payment data to JSON", e);
            contentJson = String.format(
                "{\"messageType\":\"PAYMENT\",\"paymentId\":%d,\"amount\":%s,\"status\":\"COMPLETED\",\"message\":%s}",
                paymentTx.getId(), amount.toPlainString(),
                objectMapper.valueToTree(request.getMessage() != null ? request.getMessage().trim() : "")
            );
        }

        Message chatMessage = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(contentJson)
                .messageType("PAYMENT")
                .isEdited(false)
                .isDeleted(false)
                .build();
        chatMessage = messageRepository.save(chatMessage);

        // Update conversation timestamp for sidebar ordering
        conv.setUpdatedAt(now);
        conversationRepository.save(conv);

        // 12. Build MessageResponse and broadcast via WebSocket
        MessageResponse.PaymentInfo paymentInfo = MessageResponse.PaymentInfo.builder()
                .paymentId(paymentTx.getId())
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .status("COMPLETED")
                .message(request.getMessage() != null ? request.getMessage().trim() : "")
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .receiverId(receiver.getId())
                .receiverName(receiver.getFullName())
                .transactionReference(txRef)
                .completedAt(now)
                .build();

        MessageResponse messageResponse = MessageResponse.builder()
                .id(chatMessage.getId())
                .conversationId(conv.getId())
                .sender(MessageResponse.SenderInfo.builder()
                        .id(sender.getId())
                        .fullName(sender.getFullName())
                        .profileImage(sender.getProfileImage())
                        .role(sender.getRole())
                        .build())
                .content(contentJson)
                .messageType("PAYMENT")
                .paymentInfo(paymentInfo)
                .isEdited(false)
                .isDeleted(false)
                .createdAt(chatMessage.getCreatedAt() != null ? chatMessage.getCreatedAt() : now)
                .updatedAt(chatMessage.getUpdatedAt() != null ? chatMessage.getUpdatedAt() : now)
                .attachments(Collections.emptyList())
                .readByUserIds(Collections.emptyList())
                .build();

        // Broadcast to conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversation." + conv.getId() + ".messages",
                messageResponse
        );

        // Broadcast real-time payment event
        Map<String, Object> eventPayload = new LinkedHashMap<>(paymentDataMap);
        eventPayload.put("conversationId", conv.getId());
        messagingTemplate.convertAndSend(
                "/topic/conversation." + conv.getId() + ".payments",
                eventPayload
        );
        messagingTemplate.convertAndSend(
                "/topic/user." + receiver.getId() + ".payments",
                eventPayload
        );

        // 13. Create notifications
        String noteSuffix = (request.getMessage() != null && !request.getMessage().trim().isEmpty())
                ? "\n\"" + request.getMessage().trim() + "\""
                : "";

        Notification receiverNotif = new Notification();
        receiverNotif.setUser(receiver);
        receiverNotif.setTitle("💰 Payment Received");
        receiverNotif.setMessage(String.format("%s sent you $%s%s",
                sender.getFullName(),
                amount.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                noteSuffix));
        receiverNotif.setType("PAYMENT");
        receiverNotif.setReferenceId(conv.getId());
        receiverNotif.setIsRead(false);
        notificationRepository.save(receiverNotif);

        // Broadcast notification to receiver over STOMP
        Map<String, Object> notifWs = new LinkedHashMap<>();
        notifWs.put("id", receiverNotif.getId());
        notifWs.put("title", receiverNotif.getTitle());
        notifWs.put("message", receiverNotif.getMessage());
        notifWs.put("type", "PAYMENT");
        notifWs.put("referenceId", conv.getId());
        notifWs.put("createdAt", now.toString());
        messagingTemplate.convertAndSend("/topic/user." + receiver.getId() + ".notifications", notifWs);

        // Sender notification
        Notification senderNotif = new Notification();
        senderNotif.setUser(sender);
        senderNotif.setTitle("💸 Payment Sent");
        senderNotif.setMessage(String.format("You sent $%s to %s",
                amount.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                receiver.getFullName()));
        senderNotif.setType("PAYMENT");
        senderNotif.setReferenceId(conv.getId());
        senderNotif.setIsRead(false);
        notificationRepository.save(senderNotif);

        log.info("Instant payment completed successfully: reference={}, amount={}", txRef, amount);

        return ChatPaymentResponse.builder()
                .paymentId(paymentTx.getId())
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .status("COMPLETED")
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .receiverId(receiver.getId())
                .receiverName(receiver.getFullName())
                .transactionReference(txRef)
                .message(request.getMessage())
                .newSenderBalance(senderWallet.getUsdBalance())
                .completedAt(now)
                .build();
    }

    private void assertMember(Conversation conv, Long userId, String errorMsg) {
        boolean isMember = conv.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(userId));
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, errorMsg);
        }
    }

    private String generateReferenceNumber() {
        Random random = new Random();
        int suffix = 10000 + random.nextInt(90000);
        return "FP-PAY-" + System.currentTimeMillis() + "-" + suffix;
    }
}
