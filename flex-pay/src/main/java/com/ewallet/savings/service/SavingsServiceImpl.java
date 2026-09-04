package com.ewallet.savings.service;

import com.ewallet.savings.dto.*;
import com.ewallet.savings.entity.SavingGoal;
import com.ewallet.savings.entity.SavingReminder;
import com.ewallet.savings.entity.SavingStreak;
import com.ewallet.savings.entity.SavingTransaction;
import com.ewallet.savings.repository.SavingGoalRepository;
import com.ewallet.savings.repository.SavingReminderRepository;
import com.ewallet.savings.repository.SavingStreakRepository;
import com.ewallet.savings.repository.SavingTransactionRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsServiceImpl implements SavingsService {

    private final SavingGoalRepository goalRepository;
    private final SavingTransactionRepository transactionRepository;
    private final SavingReminderRepository reminderRepository;
    private final SavingStreakRepository streakRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final TransactionRepository walletTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public SavingsSummaryResponse getSummary(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElse(null);
        BigDecimal totalSavings = wallet != null ? wallet.getSavingsBalance() : BigDecimal.ZERO;
        long activeCount = goalRepository.countByUserIdAndStatus(userId, "ACTIVE");
        long completedCount = goalRepository.countByUserIdAndStatus(userId, "COMPLETED");

        BigDecimal walletBal = wallet != null ? wallet.getUsdBalance() : BigDecimal.ZERO;

        SavingStreak streak = streakRepository.findByUserId(userId).orElse(null);
        int currentStreak = 0;
        int bestStreak = 0;
        if (streak != null) {
            currentStreak = computeActualStreak(streak);
            bestStreak = streak.getBestStreak();
        }

        return SavingsSummaryResponse.builder()
                .totalSavings(totalSavings != null ? totalSavings : BigDecimal.ZERO)
                .mainWalletBalance(walletBal)
                .activeGoalsCount(activeCount)
                .completedGoalsCount(completedCount)
                .currentStreak(currentStreak)
                .bestStreak(bestStreak)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavingGoalResponse> getGoals(Long userId, String status) {
        List<SavingGoal> goals;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            goals = goalRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status.toUpperCase());
        } else {
            goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return goals.stream().map(this::mapToGoalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SavingGoalResponse createGoal(Long userId, SavingGoalRequest request) {
        User user = getUser(userId);

        if (request.getTargetAmount() == null || request.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target amount must be greater than 0");
        }
        if (request.getTargetDate() == null || request.getTargetDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target date cannot be in the past");
        }

        SavingGoal goal = SavingGoal.builder()
                .user(user)
                .name(request.getName().trim())
                .icon(request.getIcon() != null && !request.getIcon().isBlank() ? request.getIcon().trim() : "🎯")
                .category(request.getCategory().trim())
                .targetAmount(request.getTargetAmount().setScale(4, RoundingMode.HALF_UP))
                .currentAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP))
                .targetDate(request.getTargetDate())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status("ACTIVE")
                .build();

        SavingGoal saved = goalRepository.save(goal);
        log.info("Created saving goal '{}' for user ID {}", saved.getName(), userId);
        return mapToGoalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SavingGoalResponse getGoalDetails(Long userId, Long goalId) {
        SavingGoal goal = getOwnedGoal(userId, goalId);
        return mapToGoalResponse(goal);
    }

    @Override
    @Transactional
    public SavingGoalResponse updateGoal(Long userId, Long goalId, SavingGoalRequest request) {
        SavingGoal goal = getOwnedGoal(userId, goalId);

        if (request.getName() != null && !request.getName().isBlank()) {
            goal.setName(request.getName().trim());
        }
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            goal.setIcon(request.getIcon().trim());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            goal.setCategory(request.getCategory().trim());
        }
        if (request.getTargetAmount() != null && request.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            goal.setTargetAmount(request.getTargetAmount().setScale(4, RoundingMode.HALF_UP));
            if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
                goal.setStatus("COMPLETED");
            } else if ("COMPLETED".equals(goal.getStatus())) {
                goal.setStatus("ACTIVE");
            }
        }
        if (request.getTargetDate() != null) {
            goal.setTargetDate(request.getTargetDate());
        }
        if (request.getDescription() != null) {
            goal.setDescription(request.getDescription().trim());
        }

        SavingGoal updated = goalRepository.save(goal);
        return mapToGoalResponse(updated);
    }

    @Override
    @Transactional
    public void cancelGoal(Long userId, Long goalId) {
        SavingGoal goal = getOwnedGoal(userId, goalId);

        if ("CANCELLED".equals(goal.getStatus())) {
            return;
        }

        // Return any remaining funds back to Main Wallet
        if (goal.getCurrentAmount() != null && goal.getCurrentAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal refundAmt = goal.getCurrentAmount();
            Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User wallet not found"));

            wallet.creditBalance("USD", "MAIN", refundAmt);
            wallet.deductBalance("USD", "SAVINGS", refundAmt);
            walletRepository.save(wallet);

            SavingTransaction tx = SavingTransaction.builder()
                    .goal(goal)
                    .user(goal.getUser())
                    .amount(refundAmt)
                    .type("WITHDRAW")
                    .note("Refund on Goal Cancellation: " + goal.getName())
                    .build();
            transactionRepository.save(tx);

            recordWalletTransaction(wallet, null, refundAmt, "SAVING_WITHDRAW", "Refund on Goal Cancellation: " + goal.getName());
            goal.setCurrentAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        }

        goal.setStatus("CANCELLED");
        goalRepository.save(goal);
        log.info("Cancelled saving goal ID {} for user ID {}", goalId, userId);
    }

    @Override
    @Transactional
    public SavingGoalResponse depositToGoal(Long userId, Long goalId, DepositSavingRequest request) {
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deposit amount must be greater than 0");
        }

        SavingGoal goal = getOwnedGoal(userId, goalId);
        if ("COMPLETED".equals(goal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Goal is already completed");
        }
        if ("CANCELLED".equals(goal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot deposit into a cancelled goal");
        }

        // Lock Main Wallet and verify balance
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User wallet not found"));

        if (wallet.getUsdBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Insufficient wallet balance. Available: $%.2f, Requested: $%.2f",
                            wallet.getUsdBalance(), amount));
        }

        // 1. Deduct from Main Wallet, Credit to Savings Wallet
        wallet.deductBalance("USD", "MAIN", amount);
        wallet.creditBalance("USD", "SAVINGS", amount);
        walletRepository.save(wallet);

        // 2. Add to Goal
        goal.setCurrentAmount(goal.getCurrentAmount().add(amount).setScale(4, RoundingMode.HALF_UP));
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus("COMPLETED");
            log.info("Goal ID {} reached target! Status set to COMPLETED", goalId);
        }
        SavingGoal savedGoal = goalRepository.save(goal);

        // 3. Create SavingTransaction
        String note = request.getNote() != null && !request.getNote().isBlank()
                ? request.getNote().trim()
                : "Saved towards " + goal.getName();

        SavingTransaction tx = SavingTransaction.builder()
                .goal(savedGoal)
                .user(savedGoal.getUser())
                .amount(amount.setScale(4, RoundingMode.HALF_UP))
                .type("ADD")
                .note(note)
                .build();
        transactionRepository.save(tx);

        // 4. Record in Main Wallet Transaction History
        recordWalletTransaction(null, wallet, amount, "SAVING_DEPOSIT", note);

        // 5. Update Saving Streak
        updateStreakOnDeposit(userId);

        return mapToGoalResponse(savedGoal);
    }

    @Override
    @Transactional
    public SavingGoalResponse withdrawFromGoal(Long userId, Long goalId, WithdrawSavingRequest request) {
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Withdrawal amount must be greater than 0");
        }

        SavingGoal goal = getOwnedGoal(userId, goalId);
        if ("CANCELLED".equals(goal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot withdraw from a cancelled goal");
        }

        if (goal.getCurrentAmount().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Withdrawal amount ($%.2f) exceeds goal balance ($%.2f)",
                            amount, goal.getCurrentAmount()));
        }

        // Lock Main Wallet
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User wallet not found"));

        // 1. Deduct from Goal
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(amount).setScale(4, RoundingMode.HALF_UP));
        if ("COMPLETED".equals(goal.getStatus()) && goal.getCurrentAmount().compareTo(goal.getTargetAmount()) < 0) {
            goal.setStatus("ACTIVE");
        }
        SavingGoal savedGoal = goalRepository.save(goal);

        // 2. Add back to Main Wallet, Deduct from Savings Wallet
        wallet.creditBalance("USD", "MAIN", amount);
        wallet.deductBalance("USD", "SAVINGS", amount);
        walletRepository.save(wallet);

        // 3. Create SavingTransaction
        String note = request.getNote() != null && !request.getNote().isBlank()
                ? request.getNote().trim()
                : "Withdrawn from " + goal.getName();

        SavingTransaction tx = SavingTransaction.builder()
                .goal(savedGoal)
                .user(savedGoal.getUser())
                .amount(amount.setScale(4, RoundingMode.HALF_UP))
                .type("WITHDRAW")
                .note(note)
                .build();
        transactionRepository.save(tx);

        // 4. Record in Main Wallet Transaction History
        recordWalletTransaction(wallet, null, amount, "SAVING_WITHDRAW", note);

        return mapToGoalResponse(savedGoal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavingTransactionResponse> getGoalTransactions(Long userId, Long goalId) {
        SavingGoal goal = getOwnedGoal(userId, goalId);
        List<SavingTransaction> list = transactionRepository.findByGoalIdOrderByCreatedAtDesc(goal.getId());
        return list.stream().map(this::mapToTransactionResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavingTransactionResponse> getAllTransactions(Long userId) {
        List<SavingTransaction> list = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::mapToTransactionResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SavingStreakResponse getStreak(Long userId) {
        SavingStreak streak = streakRepository.findByUserId(userId).orElse(null);
        int current = streak != null ? computeActualStreak(streak) : 0;
        int best = streak != null ? streak.getBestStreak() : 0;
        LocalDate lastDate = streak != null ? streak.getLastSavingDate() : null;

        // Determine next milestone (e.g. 7, 14, 21, 30, 60, 100, 365)
        int[] milestones = {7, 14, 21, 30, 60, 100, 365};
        int nextMilestone = 7;
        for (int m : milestones) {
            if (current < m) {
                nextMilestone = m;
                break;
            }
        }
        if (current >= 365) {
            nextMilestone = current + 30;
        }
        int daysRemaining = Math.max(0, nextMilestone - current);

        // Weekly calendar for current Monday to Sunday
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<SavingStreakResponse.WeeklyStreakDay> weekly = new ArrayList<>();
        String[] dayLetters = {"M", "T", "W", "T", "F", "S", "S"};

        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            boolean completed = false;
            if (lastDate != null) {
                if (d.equals(lastDate)) {
                    completed = true;
                } else if (d.isBefore(lastDate) && !d.isBefore(lastDate.minusDays(current - 1))) {
                    completed = true;
                }
            }

            weekly.add(SavingStreakResponse.WeeklyStreakDay.builder()
                    .dayName(dayLetters[i])
                    .date(d)
                    .completed(completed)
                    .isToday(d.equals(today))
                    .build());
        }

        return SavingStreakResponse.builder()
                .currentStreak(current)
                .bestStreak(best)
                .lastSavingDate(lastDate)
                .nextMilestone(nextMilestone)
                .daysRemainingToMilestone(daysRemaining)
                .weeklyCalendar(weekly)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SavingReminderResponse getReminder(Long userId, Long goalId) {
        SavingGoal goal = getOwnedGoal(userId, goalId);
        SavingReminder reminder = reminderRepository.findByGoalId(goal.getId()).orElse(null);
        if (reminder == null) {
            return null;
        }
        return mapToReminderResponse(reminder);
    }

    @Override
    @Transactional
    public SavingReminderResponse saveReminder(Long userId, Long goalId, SavingReminderRequest request) {
        SavingGoal goal = getOwnedGoal(userId, goalId);

        SavingReminder reminder = reminderRepository.findByGoalId(goal.getId())
                .orElse(SavingReminder.builder()
                        .goal(goal)
                        .user(goal.getUser())
                        .build());

        reminder.setFrequency(request.getFrequency().toUpperCase());
        reminder.setAmount(request.getAmount().setScale(4, RoundingMode.HALF_UP));
        reminder.setReminderTime(request.getReminderTime());
        reminder.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        SavingReminder saved = reminderRepository.save(reminder);
        return mapToReminderResponse(saved);
    }

    @Override
    @Transactional
    public void deleteReminder(Long userId, Long goalId) {
        SavingGoal goal = getOwnedGoal(userId, goalId);
        reminderRepository.findByGoalId(goal.getId()).ifPresent(reminderRepository::delete);
    }

    // ── Helper Methods ───────────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private SavingGoal getOwnedGoal(Long userId, Long goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found or does not belong to user"));
    }

    private int computeActualStreak(SavingStreak streak) {
        if (streak == null || streak.getLastSavingDate() == null) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        LocalDate last = streak.getLastSavingDate();

        // If last saving date was today or yesterday, streak is active
        if (last.equals(today) || last.equals(today.minusDays(1))) {
            return streak.getCurrentStreak();
        }
        // Missed at least 1 day
        return 0;
    }

    private void updateStreakOnDeposit(Long userId) {
        User user = getUser(userId);
        SavingStreak streak = streakRepository.findByUserId(userId)
                .orElse(SavingStreak.builder()
                        .user(user)
                        .currentStreak(0)
                        .bestStreak(0)
                        .build());

        LocalDate today = LocalDate.now();
        LocalDate last = streak.getLastSavingDate();

        if (last == null) {
            streak.setCurrentStreak(1);
        } else if (last.equals(today)) {
            // Multiple deposits on the same day count as 1 streak day
        } else if (last.equals(today.minusDays(1))) {
            // Consecutive day
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            // Streak broken
            streak.setCurrentStreak(1);
        }

        streak.setLastSavingDate(today);
        if (streak.getCurrentStreak() > streak.getBestStreak()) {
            streak.setBestStreak(streak.getCurrentStreak());
        }

        streakRepository.save(streak);
    }

    private void recordWalletTransaction(Wallet receiverWallet, Wallet senderWallet, BigDecimal amount, String type, String note) {
        try {
            Transaction tx = new Transaction();
            tx.setTransactionNo("SAV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tx.setSenderWallet(senderWallet);
            tx.setReceiverWallet(receiverWallet);
            tx.setAmount(amount.setScale(2, RoundingMode.HALF_UP));
            tx.setFee(BigDecimal.ZERO);
            tx.setTotalAmount(amount.setScale(2, RoundingMode.HALF_UP));
            tx.setTransactionType(type);
            tx.setStatus("SUCCESS");
            tx.setCurrency("USD");
            tx.setNote(note);
            tx.setCreatedAt(LocalDateTime.now());
            walletTransactionRepository.save(tx);
        } catch (Exception e) {
            log.warn("Could not record wallet transaction audit: {}", e.getMessage());
        }
    }

    private SavingGoalResponse mapToGoalResponse(SavingGoal goal) {
        double progress = 0.0;
        BigDecimal remaining = goal.getTargetAmount();
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal progRatio = goal.getCurrentAmount().divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP);
            progress = progRatio.multiply(new BigDecimal("100")).setScale(1, RoundingMode.HALF_UP).doubleValue();
            progress = Math.min(100.0, Math.max(0.0, progress));
            remaining = goal.getTargetAmount().subtract(goal.getCurrentAmount()).max(BigDecimal.ZERO);
        }

        return SavingGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .icon(goal.getIcon())
                .category(goal.getCategory())
                .targetAmount(goal.getTargetAmount().setScale(2, RoundingMode.HALF_UP))
                .currentAmount(goal.getCurrentAmount().setScale(2, RoundingMode.HALF_UP))
                .progress(progress)
                .remainingAmount(remaining.setScale(2, RoundingMode.HALF_UP))
                .targetDate(goal.getTargetDate())
                .description(goal.getDescription())
                .status(goal.getStatus())
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }

    private SavingTransactionResponse mapToTransactionResponse(SavingTransaction tx) {
        return SavingTransactionResponse.builder()
                .id(tx.getId())
                .goalId(tx.getGoal().getId())
                .goalName(tx.getGoal().getName())
                .amount(tx.getAmount().setScale(2, RoundingMode.HALF_UP))
                .type(tx.getType())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private SavingReminderResponse mapToReminderResponse(SavingReminder r) {
        return SavingReminderResponse.builder()
                .id(r.getId())
                .goalId(r.getGoal().getId())
                .frequency(r.getFrequency())
                .amount(r.getAmount().setScale(2, RoundingMode.HALF_UP))
                .reminderTime(r.getReminderTime())
                .enabled(r.getEnabled())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
