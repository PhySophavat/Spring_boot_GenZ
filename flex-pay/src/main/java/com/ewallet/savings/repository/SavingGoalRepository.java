package com.ewallet.savings.repository;

import com.ewallet.savings.entity.SavingGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {

    List<SavingGoal> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SavingGoal> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    Optional<SavingGoal> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(g.currentAmount), 0) FROM SavingGoal g WHERE g.user.id = :userId AND g.status != 'CANCELLED'")
    BigDecimal sumTotalSavingsByUserId(@Param("userId") Long userId);

    long countByUserIdAndStatus(Long userId, String status);
}
