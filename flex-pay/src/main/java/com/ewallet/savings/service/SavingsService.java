package com.ewallet.savings.service;

import com.ewallet.savings.dto.*;

import java.util.List;

public interface SavingsService {

    SavingsSummaryResponse getSummary(Long userId);

    List<SavingGoalResponse> getGoals(Long userId, String status);

    SavingGoalResponse createGoal(Long userId, SavingGoalRequest request);

    SavingGoalResponse getGoalDetails(Long userId, Long goalId);

    SavingGoalResponse updateGoal(Long userId, Long goalId, SavingGoalRequest request);

    void cancelGoal(Long userId, Long goalId);

    SavingGoalResponse depositToGoal(Long userId, Long goalId, DepositSavingRequest request);

    SavingGoalResponse withdrawFromGoal(Long userId, Long goalId, WithdrawSavingRequest request);

    List<SavingTransactionResponse> getGoalTransactions(Long userId, Long goalId);

    SavingStreakResponse getStreak(Long userId);

    SavingReminderResponse getReminder(Long userId, Long goalId);

    SavingReminderResponse saveReminder(Long userId, Long goalId, SavingReminderRequest request);

    void deleteReminder(Long userId, Long goalId);
}
