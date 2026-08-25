package com.ewallet.chat.websocket;

import com.ewallet.chat.service.ChatService;
import com.ewallet.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * Listens for WebSocket session lifecycle events to broadcast
 * ONLINE/OFFLINE presence status to all subscribers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final ChatService chatService;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        // Principal set by WebSocketChannelInterceptor is UsernamePasswordAuthenticationToken
        if (principal instanceof org.springframework.security.core.Authentication auth
            && auth.getPrincipal() instanceof User user) {
            log.debug("User {} connected via WebSocket", user.getId());
            chatService.broadcastUserStatus(user.getId(), "ONLINE");
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        if (principal instanceof org.springframework.security.core.Authentication auth
            && auth.getPrincipal() instanceof User user) {
            log.debug("User {} disconnected from WebSocket", user.getId());
            chatService.broadcastUserStatus(user.getId(), "OFFLINE");
        }
    }
}
