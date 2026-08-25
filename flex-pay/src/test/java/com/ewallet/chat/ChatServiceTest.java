package com.ewallet.chat;

import com.ewallet.chat.dto.CreateConversationRequest;
import com.ewallet.chat.dto.ConversationResponse;
import com.ewallet.chat.dto.MessageResponse;
import com.ewallet.chat.dto.SendMessageRequest;
import com.ewallet.chat.entity.*;
import com.ewallet.chat.repository.*;
import com.ewallet.chat.service.ChatService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ChatService.
 * Uses Mockito to isolate the service from the database.
 */
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock ConversationRepository  conversationRepository;
    @Mock MessageRepository       messageRepository;
    @Mock MessageReadRepository   messageReadRepository;
    @Mock AttachmentRepository    attachmentRepository;
    @Mock UserRepository          userRepository;
    @Mock SimpMessagingTemplate   messagingTemplate;

    @InjectMocks
    ChatService chatService;

    private User adminUser;
    private User regularUser;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(chatService, "uploadDir",      "./uploads");
        ReflectionTestUtils.setField(chatService, "maxFileSizeBytes", 10_485_760L);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setFullName("Admin User");
        adminUser.setPhoneNumber("+85512345678");
        adminUser.setPasswordHash("$2a$12$hash");
        adminUser.setRole("ADMIN");

        regularUser = new User();
        regularUser.setId(2L);
        regularUser.setFullName("Regular User");
        regularUser.setPhoneNumber("+85598765432");
        regularUser.setPasswordHash("$2a$12$hash");
        regularUser.setRole("USER");

        ConversationMember adminMember = ConversationMember.builder()
            .user(adminUser).build();
        ConversationMember userMember = ConversationMember.builder()
            .user(regularUser).build();

        conversation = Conversation.builder()
            .id(1L)
            .type("DIRECT")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .members(new ArrayList<>(List.of(adminMember, userMember)))
            .messages(new ArrayList<>())
            .build();

        // Link members back to conversation
        adminMember.setConversation(conversation);
        userMember.setConversation(conversation);
    }

    // ─── Conversation Tests ───────────────────────────────────────────

    @Test
    @DisplayName("getConversationsForUser - returns conversations the user is a member of")
    void getConversationsForUser_returnsConversations() {
        when(conversationRepository.findAllByMemberUserId(adminUser.getId()))
            .thenReturn(List.of(conversation));
        when(messageRepository.countUnreadMessages(anyLong(), anyLong())).thenReturn(0L);

        List<ConversationResponse> result = chatService.getConversationsForUser(adminUser.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(conversation.getId());
    }

    @Test
    @DisplayName("createOrGetDirectConversation - returns existing conversation if one already exists")
    void createOrGetDirectConversation_returnsExisting() {
        when(conversationRepository.findDirectConversationBetween(1L, 2L))
            .thenReturn(Optional.of(conversation));
        when(messageRepository.countUnreadMessages(anyLong(), anyLong())).thenReturn(0L);

        ConversationResponse result =
            chatService.createOrGetDirectConversation(adminUser.getId(), regularUser.getId());

        assertThat(result.getId()).isEqualTo(conversation.getId());
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    @DisplayName("createOrGetDirectConversation - creates new conversation when none exists")
    void createOrGetDirectConversation_createsNew() {
        when(conversationRepository.findDirectConversationBetween(1L, 2L))
            .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(conversationRepository.save(any())).thenReturn(conversation);
        when(messageRepository.countUnreadMessages(anyLong(), anyLong())).thenReturn(0L);

        ConversationResponse result =
            chatService.createOrGetDirectConversation(adminUser.getId(), regularUser.getId());

        assertThat(result).isNotNull();
        verify(conversationRepository, atLeastOnce()).save(any(Conversation.class));
    }

    // ─── Message Tests ────────────────────────────────────────────────

    @Test
    @DisplayName("sendMessage - saves and broadcasts to conversation topic")
    void sendMessage_savesAndBroadcasts() {
        SendMessageRequest req = new SendMessageRequest();
        req.setConversationId(1L);
        req.setContent("Hello User!");
        req.setMessageType("TEXT");

        Message savedMessage = Message.builder()
            .id(10L)
            .conversation(conversation)
            .sender(adminUser)
            .content("Hello User!")
            .messageType("TEXT")
            .isEdited(false)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .reads(new ArrayList<>())
            .attachments(new ArrayList<>())
            .build();

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(messageRepository.save(any())).thenReturn(savedMessage);
        when(conversationRepository.save(any())).thenReturn(conversation);

        MessageResponse response = chatService.sendMessage(req, adminUser.getId());

        assertThat(response.getContent()).isEqualTo("Hello User!");
        assertThat(response.getSender().getId()).isEqualTo(adminUser.getId());
        verify(messagingTemplate).convertAndSend(
            eq("/topic/conversation.1.messages"), any(MessageResponse.class));
    }

    @Test
    @DisplayName("sendMessage - throws when not a conversation member")
    void sendMessage_throwsWhenNotMember() {
        User outsider = new User();
        outsider.setId(99L);

        SendMessageRequest req = new SendMessageRequest();
        req.setConversationId(1L);
        req.setContent("Hi");
        req.setMessageType("TEXT");

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.sendMessage(req, outsider.getId()))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("editMessage - updates content and sets isEdited flag")
    void editMessage_updatesContentAndBroadcasts() {
        Message msg = Message.builder()
            .id(10L)
            .conversation(conversation)
            .sender(adminUser)
            .content("Old content")
            .messageType("TEXT")
            .isEdited(false)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .reads(new ArrayList<>())
            .attachments(new ArrayList<>())
            .build();

        when(messageRepository.findById(10L)).thenReturn(Optional.of(msg));
        when(messageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse response = chatService.editMessage(10L, "New content", adminUser.getId());

        assertThat(response.getContent()).isEqualTo("New content");
        assertThat(response.getIsEdited()).isTrue();
        verify(messagingTemplate).convertAndSend(
            eq("/topic/conversation.1.messages.edited"), any(MessageResponse.class));
    }

    @Test
    @DisplayName("editMessage - throws when editing another user's message")
    void editMessage_throwsForWrongUser() {
        Message msg = Message.builder()
            .id(10L)
            .conversation(conversation)
            .sender(regularUser)  // owned by regularUser
            .content("User's message")
            .isEdited(false)
            .isDeleted(false)
            .reads(new ArrayList<>())
            .attachments(new ArrayList<>())
            .build();

        when(messageRepository.findById(10L)).thenReturn(Optional.of(msg));

        assertThatThrownBy(() -> chatService.editMessage(10L, "Hacked", adminUser.getId()))
            .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("deleteMessage - soft-deletes and nulls content")
    void deleteMessage_softDeletesMessage() {
        Message msg = Message.builder()
            .id(10L)
            .conversation(conversation)
            .sender(regularUser)
            .content("Delete me")
            .isEdited(false)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .reads(new ArrayList<>())
            .attachments(new ArrayList<>())
            .build();

        when(messageRepository.findById(10L)).thenReturn(Optional.of(msg));
        when(messageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Admin can delete any message
        MessageResponse response = chatService.deleteMessage(10L, adminUser.getId(), true);

        assertThat(response.getIsDeleted()).isTrue();
        assertThat(response.getContent()).isNull();
        verify(messagingTemplate).convertAndSend(
            eq("/topic/conversation.1.messages.deleted"), any(MessageResponse.class));
    }

    @Test
    @DisplayName("markMessageRead - idempotent: does not insert duplicate read receipt")
    void markMessageRead_idempotent() {
        when(messageReadRepository.existsByMessageIdAndUserId(10L, adminUser.getId()))
            .thenReturn(true); // Already read

        chatService.markMessageRead(10L, adminUser.getId());

        verify(messageReadRepository, never()).save(any());
    }

    @Test
    @DisplayName("markMessageRead - inserts read receipt and broadcasts")
    void markMessageRead_insertsAndBroadcasts() {
        Message msg = Message.builder()
            .id(10L)
            .conversation(conversation)
            .sender(regularUser)
            .content("Read me")
            .isEdited(false)
            .isDeleted(false)
            .reads(new ArrayList<>())
            .attachments(new ArrayList<>())
            .build();

        when(messageReadRepository.existsByMessageIdAndUserId(10L, adminUser.getId()))
            .thenReturn(false);
        when(messageRepository.findById(10L)).thenReturn(Optional.of(msg));
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(messageReadRepository.save(any())).thenReturn(new MessageRead());

        chatService.markMessageRead(10L, adminUser.getId());

        verify(messageReadRepository).save(any(MessageRead.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/conversation.1.read"), any(Object.class));
    }

    // ─── User Search Tests ────────────────────────────────────────────

    @Test
    @DisplayName("searchUsers - filters users by name keyword (case-insensitive)")
    void searchUsers_filtersByKeyword() {
        when(userRepository.findAll()).thenReturn(List.of(adminUser, regularUser));

        List<ConversationResponse.MemberInfo> result = chatService.searchUsers("regular");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFullName()).isEqualTo("Regular User");
    }

    @Test
    @DisplayName("getConversation - throws when user is not a member")
    void getConversation_throwsForNonMember() {
        User stranger = new User();
        stranger.setId(99L);

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        assertThatThrownBy(() -> chatService.getConversation(1L, stranger.getId()))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("getConversation - throws 404 when conversation does not exist")
    void getConversation_throwsForMissingConversation() {
        when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getConversation(999L, adminUser.getId()))
            .isInstanceOf(NoSuchElementException.class)
            .hasMessageContaining("Conversation not found");
    }
}
