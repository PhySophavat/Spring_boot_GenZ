package com.ewallet.savings.repository;

import com.ewallet.savings.entity.SavingStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavingStreakRepository extends JpaRepository<SavingStreak, Long> {

    Optional<SavingStreak> findByUserId(Long userId);
}
