package com.ewallet.billsplit.repository;

import com.ewallet.billsplit.entity.SplitBillMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SplitBillMemberRepository extends JpaRepository<SplitBillMember, Long> {

    Optional<SplitBillMember> findBySplitBillIdAndUserId(Long splitBillId, Long userId);

    List<SplitBillMember> findBySplitBillId(Long splitBillId);

    List<SplitBillMember> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
}
