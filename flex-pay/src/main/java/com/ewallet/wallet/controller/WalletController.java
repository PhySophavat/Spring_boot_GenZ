package com.ewallet.wallet.controller;

import com.ewallet.wallet.dto.WalletPinRequest;
import com.ewallet.wallet.dto.WalletResponse;
import com.ewallet.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping
@Tag(name = "Wallets", description = "Wallet management API")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/api/wallets/{userId}")
    @Operation(summary = "Get wallet by user ID")
    public ResponseEntity<WalletResponse> getWallet(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getWallet(userId));
    }

    @GetMapping("/api/wallets")
    @Operation(summary = "Get all wallets (Admin)")
    public ResponseEntity<List<WalletResponse>> getAllWallets() {
        return ResponseEntity.ok(walletService.getAllWallets());
    }

    // Support both /api/wallet/me and /api/wallets/me endpoints to be flexible and comply with both requirements
    @GetMapping({"/api/wallet/me", "/api/wallets/me"})
    @Operation(summary = "Get current user wallet details")
    public ResponseEntity<WalletResponse> getMyWallet(Authentication authentication) {
        return ResponseEntity.ok(walletService.getWallet(getAuthenticatedUserId(authentication)));
    }

    @PostMapping("/api/wallets/{userId}/set-pin")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Admin: Set PIN for a user")
    public ResponseEntity<Map<String, String>> adminSetPin(
            @PathVariable Long userId,
            @Valid @RequestBody WalletPinRequest request) {
        walletService.createPin(userId, request.getPin(), request.getConfirmPin());
        return ResponseEntity.ok(Map.of("message", "PIN set successfully"));
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new org.springframework.security.access.AccessDeniedException("User is not authenticated");
        }
        return ((com.ewallet.user.entity.User) authentication.getPrincipal()).getId();
    }
}
