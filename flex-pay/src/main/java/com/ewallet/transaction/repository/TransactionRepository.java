package com.ewallet.transaction.repository;

import com.ewallet.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.senderWallet.id = :walletId OR t.receiverWallet.id = :walletId ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactionsByWalletId(@Param("walletId") Long walletId);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:currency IS NULL OR t.currency = :currency) AND " +
           "(:status IS NULL OR t.status = :status) " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findFilteredTransactions(
        @Param("currency") String currency,
        @Param("status") String status
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.createdAt >= :startOfDay")
    Long countTransactionsSince(@Param("startOfDay") java.time.LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.createdAt >= :startOfDay AND t.currency = 'USD' AND t.status = 'SUCCESS'")
    java.math.BigDecimal sumUsdAmountSince(@Param("startOfDay") java.time.LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.createdAt >= :startOfDay AND t.currency = 'KHR' AND t.status = 'SUCCESS'")
    java.math.BigDecimal sumKhrAmountSince(@Param("startOfDay") java.time.LocalDateTime startOfDay);
}
