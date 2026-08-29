package com.ewallet.billsplit.repository;

import com.ewallet.billsplit.entity.SplitBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SplitBillRepository extends JpaRepository<SplitBill, Long> {

    List<SplitBill> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    @Query("SELECT DISTINCT sb FROM SplitBill sb LEFT JOIN sb.members m WHERE sb.creator.id = :userId OR m.user.id = :userId ORDER BY sb.createdAt DESC")
    List<SplitBill> findAllForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT sb FROM SplitBill sb LEFT JOIN FETCH sb.members m LEFT JOIN FETCH m.user LEFT JOIN FETCH sb.creator WHERE sb.id = :id")
    Optional<SplitBill> findByIdWithMembers(@Param("id") Long id);
}
