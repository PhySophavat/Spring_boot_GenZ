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

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Register and login with phone number and password")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a user")
    @SecurityRequirements
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
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
