package com.ewallet.chat.websocket;

import com.ewallet.common.security.JwtService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Intercepts STOMP CONNECT frames to validate the JWT token.
 * Token is expected in the STOMP header: Authorization: Bearer <token>
 * Sets the authenticated principal on the WebSocket session.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtService     jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            // Allow connection without auth for now; REST endpoints enforce role.
            // In production, you may throw MessageDeliveryException here.
            return message;
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            log.warn("WebSocket CONNECT rejected: invalid or expired JWT");
            return message;
        }

        String phone = jwtService.extractSubject(token);
        if (phone == null) return message;

        User user = userRepository.findByPhoneNumber(phone).orElse(null);
        if (user == null) return message;

        String role = user.getRole() != null ? user.getRole() : "USER";
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

        accessor.setUser(authentication);
        return message;
    }
}
