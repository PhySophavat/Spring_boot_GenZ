package com.ewallet.savings.repository;

import com.ewallet.savings.entity.SavingReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavingReminderRepository extends JpaRepository<SavingReminder, Long> {

    Optional<SavingReminder> findByGoalId(Long goalId);

    Optional<SavingReminder> findByGoalIdAndUserId(Long goalId, Long userId);
}
