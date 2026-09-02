package com.ewallet.chat.controller;

import com.ewallet.chat.dto.ApiResponse;
import com.ewallet.chat.dto.ChatPaymentRequest;
import com.ewallet.chat.dto.ChatPaymentResponse;
import com.ewallet.chat.service.ChatPaymentService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat Payments", description = "Instant Social Payments inside Chat")
public class ChatPaymentController {

    private final ChatPaymentService chatPaymentService;
    private final UserRepository userRepository;

    /**
     * Executes an instant social payment within a chat conversation.
     * Supported on both /api/chat/payments and /api/admin/chat/payments.
     */
    @PostMapping({"/api/chat/payments", "/api/admin/chat/payments"})
    @Operation(summary = "Send an instant payment to another user in chat")
    public ResponseEntity<ApiResponse<ChatPaymentResponse>> sendPayment(
            @Valid @RequestBody ChatPaymentRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long senderUserId = resolveSenderUserId(principal, authentication);
        ChatPaymentResponse response = chatPaymentService.processChatPayment(senderUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    private Long resolveSenderUserId(User principal, Authentication authentication) {
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        if (authentication != null && authentication.getName() != null) {
            // Could be phone number or email subject in token
            String sub = authentication.getName();
            return userRepository.findByPhoneNumber(sub)
                    .or(() -> userRepository.findByEmailIgnoreCase(sub))
                    .map(User::getId)
                    .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        }
        throw new AccessDeniedException("User not authenticated");
    }
}
