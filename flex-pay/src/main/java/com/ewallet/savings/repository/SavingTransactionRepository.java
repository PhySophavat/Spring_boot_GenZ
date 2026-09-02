package com.ewallet.savings.repository;

import com.ewallet.savings.entity.SavingTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingTransactionRepository extends JpaRepository<SavingTransaction, Long> {

    List<SavingTransaction> findByGoalIdOrderByCreatedAtDesc(Long goalId);

    List<SavingTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
