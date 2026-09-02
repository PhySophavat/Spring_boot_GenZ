package com.ewallet.savings.controller;

import com.ewallet.chat.dto.ApiResponse;
import com.ewallet.savings.dto.*;
import com.ewallet.savings.service.SavingsService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/savings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Savings", description = "Savings Feature: Goals, Deposits, Withdrawals, Streaks, and Reminders")
public class SavingsController {

    private final SavingsService savingsService;
    private final UserRepository userRepository;

    @GetMapping("/summary")
    @Operation(summary = "Get user total savings summary and streak")
    public ResponseEntity<ApiResponse<SavingsSummaryResponse>> getSummary(
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingsSummaryResponse summary = savingsService.getSummary(userId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/goals")
    @Operation(summary = "Get user saving goals with optional status filter (ALL, ACTIVE, COMPLETED)")
    public ResponseEntity<ApiResponse<List<SavingGoalResponse>>> getGoals(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        List<SavingGoalResponse> goals = savingsService.getGoals(userId, status);
        return ResponseEntity.ok(ApiResponse.ok(goals));
    }

    @PostMapping("/goals")
    @Operation(summary = "Create a new saving goal")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> createGoal(
            @Valid @RequestBody SavingGoalRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingGoalResponse goal = savingsService.createGoal(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(goal));
    }

    @GetMapping("/goals/{id}")
    @Operation(summary = "Get details of a specific saving goal")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> getGoalDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingGoalResponse goal = savingsService.getGoalDetails(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(goal));
    }

    @PutMapping("/goals/{id}")
    @Operation(summary = "Update a saving goal")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingGoalRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingGoalResponse updated = savingsService.updateGoal(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/goals/{id}")
    @Operation(summary = "Cancel a saving goal (returns any remaining savings to wallet)")
    public ResponseEntity<ApiResponse<Void>> cancelGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        savingsService.cancelGoal(userId, id);
        return ResponseEntity.ok(ApiResponse.ok("Goal cancelled successfully", null));
    }

    @PostMapping("/goals/{id}/deposit")
    @Operation(summary = "Add money from Main Wallet to Saving Goal")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> deposit(
            @PathVariable Long id,
            @Valid @RequestBody DepositSavingRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingGoalResponse updated = savingsService.depositToGoal(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Deposit successful", updated));
    }

    @PostMapping("/goals/{id}/withdraw")
    @Operation(summary = "Withdraw money from Saving Goal back to Main Wallet")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> withdraw(
            @PathVariable Long id,
            @Valid @RequestBody WithdrawSavingRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingGoalResponse updated = savingsService.withdrawFromGoal(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Withdrawal successful", updated));
    }

    @GetMapping("/goals/{id}/transactions")
    @Operation(summary = "Get transaction history for a saving goal")
    public ResponseEntity<ApiResponse<List<SavingTransactionResponse>>> getTransactions(
            @PathVariable Long id,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        List<SavingTransactionResponse> txs = savingsService.getGoalTransactions(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(txs));
    }

    @GetMapping("/streak")
    @Operation(summary = "Get saving streak, milestones, and weekly calendar")
    public ResponseEntity<ApiResponse<SavingStreakResponse>> getStreak(
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingStreakResponse streak = savingsService.getStreak(userId);
        return ResponseEntity.ok(ApiResponse.ok(streak));
    }

    @GetMapping("/goals/{id}/reminder")
    @Operation(summary = "Get saving reminder settings for a goal")
    public ResponseEntity<ApiResponse<SavingReminderResponse>> getReminder(
            @PathVariable Long id,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingReminderResponse reminder = savingsService.getReminder(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(reminder));
    }

    @PostMapping("/goals/{id}/reminder")
    @Operation(summary = "Create or update saving reminder for a goal")
    public ResponseEntity<ApiResponse<SavingReminderResponse>> saveReminder(
            @PathVariable Long id,
            @Valid @RequestBody SavingReminderRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingReminderResponse reminder = savingsService.saveReminder(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(reminder));
    }

    @PutMapping("/goals/{id}/reminder")
    @Operation(summary = "Update saving reminder for a goal")
    public ResponseEntity<ApiResponse<SavingReminderResponse>> updateReminder(
            @PathVariable Long id,
            @Valid @RequestBody SavingReminderRequest request,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        SavingReminderResponse reminder = savingsService.saveReminder(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(reminder));
    }

    @DeleteMapping("/goals/{id}/reminder")
    @Operation(summary = "Delete saving reminder for a goal")
    public ResponseEntity<ApiResponse<Void>> deleteReminder(
            @PathVariable Long id,
            @AuthenticationPrincipal User principal,
            Authentication authentication
    ) {
        Long userId = resolveUserId(principal, authentication);
        savingsService.deleteReminder(userId, id);
        return ResponseEntity.ok(ApiResponse.ok("Reminder deleted", null));
    }

    // ── Helper: Resolve User ID from Auth Principal ───────────────────
    private Long resolveUserId(User principal, Authentication authentication) {
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        if (authentication != null && authentication.getName() != null) {
            String sub = authentication.getName();
            return userRepository.findByPhoneNumber(sub)
                    .or(() -> userRepository.findByEmailIgnoreCase(sub))
                    .map(User::getId)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User not authenticated"));
        }
        throw new org.springframework.security.access.AccessDeniedException("User not authenticated");
    }
}
