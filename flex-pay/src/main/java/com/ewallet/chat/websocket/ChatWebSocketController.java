package com.ewallet.chat.websocket;

import com.ewallet.chat.dto.SendMessageRequest;
import com.ewallet.chat.dto.TypingEvent;
import com.ewallet.chat.service.ChatService;
import com.ewallet.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

/**
 * STOMP message handlers for real-time chat events.
 *
 * WebSocket topics the frontend subscribes to:
 *   /topic/conversation.{id}.messages        — new messages
 *   /topic/conversation.{id}.messages.edited — edited messages
 *   /topic/conversation.{id}.messages.deleted— deleted messages
 *   /topic/conversation.{id}.typing          — typing events
 *   /topic/conversation.{id}.read            — read receipts
 *   /topic/users.status                      — online/offline status
 *
 * Admin sends to:
 *   /app/chat.sendMessage
 *   /app/chat.typing
 *   /app/chat.editMessage
 *   /app/chat.deleteMessage
 *   /app/chat.readMessage
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService            chatService;
    private final SimpMessagingTemplate  messagingTemplate;

    /**
     * Handles sending a message via WebSocket.
     * Saves to DB and broadcasts to conversation subscribers.
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Authentication auth) {
        if (auth == null) return;
        User sender = (User) auth.getPrincipal();
        try {
            chatService.sendMessage(request, sender.getId());
        } catch (Exception e) {
            log.error("Error sending message via WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Handles typing indicator events (TYPING_START / TYPING_STOP).
     * Broadcasts to all conversation members.
     */
    @MessageMapping("/chat.typing")
    public void typingIndicator(@Payload TypingEvent event, Authentication auth) {
        if (auth == null) return;
        User user = (User) auth.getPrincipal();
        event.setUserId(user.getId());
        event.setUserFullName(user.getFullName());

        messagingTemplate.convertAndSend(
            "/topic/conversation." + event.getConversationId() + ".typing",
            event
        );
    }

    /**
     * Handles message read receipt via WebSocket.
     */
    @MessageMapping("/chat.readMessage")
    public void readMessage(@Payload java.util.Map<String, Long> payload, Authentication auth) {
        if (auth == null) return;
        User user   = (User) auth.getPrincipal();
        Long msgId  = payload.get("messageId");
        if (msgId != null) {
            chatService.markMessageRead(msgId, user.getId());
        }
    }

    /**
     * Handles online status update via WebSocket CONNECT/DISCONNECT.
     * Called from application events in WebSocketEventListener.
     */
    @MessageMapping("/chat.status")
    public void updateStatus(@Payload java.util.Map<String, String> payload, Authentication auth) {
        if (auth == null) return;
        User user   = (User) auth.getPrincipal();
        String status = payload.getOrDefault("status", "ONLINE");
        chatService.broadcastUserStatus(user.getId(), status);
    }
}
