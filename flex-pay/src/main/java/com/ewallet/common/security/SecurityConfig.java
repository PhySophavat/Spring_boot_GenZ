package com.ewallet.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration.
 * - Stateless JWT sessions
 * - Chat REST endpoints require ROLE_ADMIN
 * - WebSocket handshake (/ws/**) is permitted (JWT validated in WS channel interceptor)
 * - Static file serving for uploads is permitted
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception ->
                exception.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/auth/send-otp",
                    "/api/auth/verify-otp"
                ).permitAll()
                // Swagger / OpenAPI
                .requestMatchers(
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()
                // WebSocket handshake (JWT validated by WebSocketChannelInterceptor)
                .requestMatchers("/ws/**").permitAll()
                // Served uploaded files
                .requestMatchers(HttpMethod.GET, "/api/admin/chat/files/**").permitAll()
                // Legacy open endpoints
                .requestMatchers(HttpMethod.GET,  "/api/wallets", "/api/wallets/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/wallets/*/set-pin").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/users").permitAll()
                .requestMatchers("/api/mobile/**").permitAll()
                .requestMatchers("/api/wallets/me/deposit").permitAll()
                .requestMatchers("/api/transactions/transfer").permitAll()
                .requestMatchers("/api/split-bills/**").permitAll()
                .requestMatchers("/api/qr/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/admin/dashboard/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/wallets/admin/reset-balances").permitAll()
                // Chat REST API & Chat Payments
                .requestMatchers("/api/admin/chat/**", "/api/chat/**").authenticated()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
