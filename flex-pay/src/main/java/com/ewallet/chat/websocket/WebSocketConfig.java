package com.ewallet.chat.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket / STOMP configuration.
 *
 * Endpoint:  /ws  (with SockJS fallback)
 * Broker:    /topic  (broadcast to all subscribers)
 *            /queue  (point-to-point)
 * App prefix: /app   (routes to @MessageMapping handlers)
 *
 * CORS is set to allow all origins here; in production, restrict to your
 * frontend origin via environment variable.
 *
 * Transport security: use wss:// in production (configure at nginx/load-balancer).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketChannelInterceptor channelInterceptor;

    public WebSocketConfig(WebSocketChannelInterceptor channelInterceptor) {
        this.channelInterceptor = channelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            .setAllowedOriginPatterns("*")   // Restrict in production
            .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for /topic and /queue destinations
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for methods annotated with @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register the JWT channel interceptor to validate STOMP CONNECT frames
        registration.interceptors(channelInterceptor);
    }
}
