package com.ewallet.auth.controller;

import com.ewallet.auth.dto.*;
import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.service.AuthService;
import com.ewallet.auth.service.OtpService;
import com.ewallet.wallet.dto.WalletPinRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
@Tag(name = "Authentication & Security", description = "Endpoints for user authentication, email OTP verification, password reset, and transaction PIN management")
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
    @Operation(summary = "Register user and generate email verification OTP")
    @SecurityRequirements
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "message", response.message(),
            "email", request.email(),
            "user", response.user(),
            "token", response.accessToken() != null ? response.accessToken() : ""
        ));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email using 6-digit OTP")
    @SecurityRequirements
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request.email(), request.otp());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", response.message(),
            "token", response.accessToken(),
            "user", response.user()
        ));
    }

    @PostMapping("/resend-email-otp")
    @Operation(summary = "Resend 6-digit registration OTP with cooldown")
    @SecurityRequirements
    public ResponseEntity<?> resendEmailOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendEmailOtp(request.email());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Verification code resent to " + request.email()
        ));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in using email/phone and login password")
    @SecurityRequirements
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "token", response.accessToken(),
            "user", response.user()
        ));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request 6-digit OTP for password recovery")
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
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "If an account exists for " + targetEmail + ", a verification code has been sent."
        ));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Verify password reset OTP and return short-lived reset token")
    @SecurityRequirements
    public ResponseEntity<VerifyResetOtpResponse> verifyResetOtp(@Valid @RequestBody VerifyResetOtpRequest request) {
        VerifyResetOtpResponse response = authService.verifyResetOtp(request.email(), request.otp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Update login password with reset authorization token")
    @SecurityRequirements
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Password reset successfully."
        ));
    }

    @PostMapping("/forgot-pin")
    @Operation(summary = "Request 6-digit OTP to reset payment PIN")
    @SecurityRequirements
    public ResponseEntity<?> forgotPin(@Valid @RequestBody ForgotPinRequest request) {
        authService.forgotPin(request.email());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Payment PIN reset code sent to " + request.email()
        ));
    }

    @PostMapping("/verify-pin-reset-otp")
    @Operation(summary = "Verify PIN reset OTP and receive reset token")
    @SecurityRequirements
    public ResponseEntity<VerifyResetOtpResponse> verifyPinResetOtp(@Valid @RequestBody VerifyPinResetOtpRequest request) {
        VerifyResetOtpResponse response = authService.verifyPinResetOtp(request.email(), request.otp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-pin")
    @Operation(summary = "Reset payment PIN using authorized reset token")
    @SecurityRequirements
    public ResponseEntity<?> resetPin(@Valid @RequestBody ResetPinRequest request) {
        authService.resetPin(request);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Payment PIN updated successfully."
        ));
    }

    @PostMapping("/create-pin")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create 6-digit transaction PIN for authenticated user")
    public ResponseEntity<?> createPin(Authentication authentication, @Valid @RequestBody WalletPinRequest request) {
        authService.createPin(authentication, request.getPin(), request.getConfirmPin());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "message", "Payment PIN created successfully."
        ));
    }

    @PostMapping("/verify-pin")
    @Operation(summary = "Verify 6-digit transaction PIN to authorize sensitive financial actions")
    public PinVerificationResponse verifyPin(Authentication authentication, @Valid @RequestBody WalletPinRequest request) {
        return authService.verifyPin(authentication, request.getPin());
    }

    @PostMapping("/change-pin")
    @Operation(summary = "Change transaction PIN for authenticated user")
    public ResponseEntity<?> changePin(Authentication authentication, @Valid @RequestBody ChangePinRequest request) {
        authService.changePin(authentication, request.currentPin(), request.newPin(), request.confirmPin());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Payment PIN changed successfully."
        ));
    }

    // --- Legacy / auxiliary endpoints for backward compatibility ---

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP code to email")
    @SecurityRequirements
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        OtpPurpose purpose = request.purpose() != null ? request.purpose() : OtpPurpose.EMAIL_VERIFICATION;
        if (purpose == OtpPurpose.FORGOT_PASSWORD || purpose == OtpPurpose.PASSWORD_RESET) {
            authService.forgotPassword(request.email());
        } else if (purpose == OtpPurpose.PIN_RESET) {
            authService.forgotPin(request.email());
        } else {
            authService.resendEmailOtp(request.email());
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "OTP sent", "email", request.email()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify generic OTP code")
    @SecurityRequirements
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        OtpPurpose purpose = request.purpose() != null ? request.purpose() : OtpPurpose.EMAIL_VERIFICATION;
        otpService.verifyOtp(request.email(), request.otp(), purpose);
        return ResponseEntity.ok(Map.of("valid", true, "success", true, "message", "OTP verified successfully"));
    }
}
