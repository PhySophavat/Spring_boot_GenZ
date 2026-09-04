package com.ewallet.auth.controller;

import com.ewallet.auth.dto.*;
import com.ewallet.auth.service.AuthService;
import com.ewallet.wallet.dto.WalletPinRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.service.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Register, OTP verification, password reset, and login")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @Value("${app.auth.otp-required:true}")
    private boolean otpRequired;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a user with OTP verification")
    @SecurityRequirements
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // If OTP requirement is active and OTP code has not been submitted yet, send OTP email
        if (otpRequired && (request.otp() == null || request.otp().isBlank())) {
            authService.sendRegistrationOtp(request.email(), request.phoneNumber());
            return ResponseEntity.ok(Map.of(
                "message", "OTP sent",
                "email", request.email(),
                "otpRequired", true
            ));
        }

        // If OTP is provided and OTP is required, verify OTP first
        if (otpRequired) {
            otpService.verifyOtp(request.email(), request.otp(), OtpPurpose.REGISTRATION);
        }

        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP code to email")
    @SecurityRequirements
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        OtpPurpose purpose = request.purpose() != null ? request.purpose() : OtpPurpose.REGISTRATION;
        if (purpose == OtpPurpose.FORGOT_PASSWORD) {
            authService.forgotPassword(request.email());
        } else {
            authService.sendRegistrationOtp(request.email(), null);
        }
        return ResponseEntity.ok(Map.of("message", "OTP sent", "email", request.email()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP code")
    @SecurityRequirements
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        OtpPurpose purpose = request.purpose() != null ? request.purpose() : OtpPurpose.REGISTRATION;
        otpService.verifyOtp(request.email(), request.otp(), purpose);
        return ResponseEntity.ok(Map.of("valid", true, "message", "OTP verified successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request OTP for forgotten password")
    @SecurityRequirements
    public ResponseEntity<?> forgotPassword(
        @RequestParam(required = false) String email,
        @RequestBody(required = false) ForgotPasswordRequest body
    ) {
        String targetEmail = (email != null && !email.isBlank())
            ? email.trim()
            : (body != null ? body.email().trim() : null);

        if (targetEmail == null || targetEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        authService.forgotPassword(targetEmail);
        return ResponseEntity.ok(Map.of("message", "OTP sent", "email", targetEmail));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    @SecurityRequirements
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with phone number and password")
    @SecurityRequirements
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/create-pin")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a wallet PIN for the logged-in user")
    public void createPin(Authentication authentication, @Valid @RequestBody WalletPinRequest request) {
        authService.createPin(authentication, request.getPin(), request.getConfirmPin());
    }

    @PostMapping("/verify-pin")
    @Operation(summary = "Verify the logged-in user PIN")
    public PinVerificationResponse verifyPin(Authentication authentication, @Valid @RequestBody WalletPinRequest request) {
        return authService.verifyPin(authentication, request.getPin());
    }

    @PostMapping("/change-pin")
    @Operation(summary = "Change the logged-in user PIN")
    public void changePin(Authentication authentication, @Valid @RequestBody ChangePinRequest request) {
        authService.changePin(authentication, request.currentPin(), request.newPin(), request.confirmPin());
    }
}
