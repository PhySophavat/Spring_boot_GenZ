package com.ewallet.payment.controller;

import com.ewallet.payment.dto.PaymentRequest;
import com.ewallet.payment.dto.PaymentResponse;
import com.ewallet.payment.dto.SendMoneyRequest;
import com.ewallet.payment.dto.SendMoneyResponse;
import com.ewallet.payment.service.PaymentService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Operations related to money transfers")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    public PaymentController(PaymentService paymentService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send")
    @Operation(summary = "Transfer money from logged-in user to receiver wallet")
    public SendMoneyResponse sendMoney(Authentication authentication, @Valid @RequestBody SendMoneyRequest request) {
        User user = getAuthenticatedUser(authentication);

        // Security Rule: PIN must already be verified
        if (!Boolean.TRUE.equals(user.getPinVerified())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "PIN must be verified before initiating transfers"
            );
        }

        return paymentService.sendMoney(user.getId(), request);
    }

    @PostMapping
    @Operation(summary = "Process payment using secure receiver token and sender PIN verification")
    public PaymentResponse processPayment(Authentication authentication, @Valid @RequestBody PaymentRequest request) {
        User user = getAuthenticatedUser(authentication);
        return paymentService.processPayment(user.getId(), request);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User principal = (User) authentication.getPrincipal();
        return userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
