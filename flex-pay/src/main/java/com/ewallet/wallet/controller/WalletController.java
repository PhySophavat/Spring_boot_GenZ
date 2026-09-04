package com.ewallet.wallet.controller;

import com.ewallet.wallet.dto.DepositRequest;
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

    @PostMapping("/api/wallets/me/deposit")
    @Operation(summary = "Deposit / top-up amount into the current user's wallet")
    public ResponseEntity<WalletResponse> deposit(
            Authentication authentication,
            @Valid @RequestBody DepositRequest request) {
        Long userId = getAuthenticatedUserId(authentication);
        return ResponseEntity.ok(walletService.deposit(userId, request));
    }

    @GetMapping("/api/wallets/balance")
    @Operation(summary = "Get single authoritative balance for Main and Savings wallets in USD and KHR")
    public ResponseEntity<Map<String, Object>> getAuthoritativeBalance(Authentication authentication) {
        Long userId = getAuthenticatedUserId(authentication);
        WalletResponse w = walletService.getWallet(userId);

        Map<String, Object> main = Map.of(
            "usd", w.getUsdBalance(),
            "khr", w.getKhrBalance()
        );
        Map<String, Object> savings = Map.of(
            "usd", w.getSavingsBalance(),
            "khr", w.getSavingsKhrBalance()
        );
        Map<String, Object> total = Map.of(
            "usd", w.getUsdBalance().add(w.getSavingsBalance()),
            "khr", w.getKhrBalance().add(w.getSavingsKhrBalance())
        );

        Map<String, Object> res = new java.util.LinkedHashMap<>();
        res.put("walletNumber", w.getWalletNumber());
        res.put("main", main);
        res.put("savings", savings);
        res.put("total", total);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/wallets/transfer-savings")
    @Operation(summary = "Atomic internal transfer between Main Wallet and Savings Wallet")
    public ResponseEntity<WalletResponse> transferSavings(
            Authentication authentication,
            @RequestBody Map<String, Object> payload) {
        Long userId = getAuthenticatedUserId(authentication);
        String from = (String) payload.getOrDefault("from", "MAIN");
        String to = (String) payload.getOrDefault("to", "SAVINGS");
        String currency = (String) payload.getOrDefault("currency", "USD");
        Object rawAmt = payload.get("amount");
        java.math.BigDecimal amount = rawAmt != null ? new java.math.BigDecimal(rawAmt.toString()) : java.math.BigDecimal.ZERO;

        return ResponseEntity.ok(walletService.transferBetweenWallets(userId, from, to, amount, currency));
    }

    @PostMapping("/api/wallets/admin/reset-balances")
    @Operation(summary = "Admin: Reset individual wallet balances by walletNumber")
    public ResponseEntity<Map<String, String>> adminResetBalances() {
        walletService.adminResetIndividualBalances();
        return ResponseEntity.ok(Map.of("message", "Wallet balances reset successfully"));
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new org.springframework.security.access.AccessDeniedException("User is not authenticated");
        }
        return ((com.ewallet.user.entity.User) authentication.getPrincipal()).getId();
    }
}
