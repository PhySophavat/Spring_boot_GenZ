package com.ewallet.payment.repository;

import com.ewallet.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    List<PaymentTransaction> findAllByConversationIdOrderByCreatedAtDesc(Long conversationId);

    boolean existsByTransactionReference(String transactionReference);
}
