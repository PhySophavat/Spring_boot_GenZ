package com.ewallet.admin.service;

import com.ewallet.admin.dto.DashboardSummaryResponse;
import com.ewallet.transaction.dto.TransactionResponse;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    public AdminDashboardServiceImpl(
        WalletRepository walletRepository,
        TransactionRepository transactionRepository
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        BigDecimal totalUsd = walletRepository.sumTotalUsdBalance();
        BigDecimal totalKhr = walletRepository.sumTotalKhrBalance();
        Long totalTxs = transactionRepository.count();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Long todayCount = transactionRepository.countTransactionsSince(startOfDay);
        BigDecimal todayUsdAmount = transactionRepository.sumUsdAmountSince(startOfDay);
        BigDecimal todayKhrAmount = transactionRepository.sumKhrAmountSince(startOfDay);

        return new DashboardSummaryResponse(
            totalUsd,
            totalKhr,
            totalTxs,
            todayCount,
            todayUsdAmount,
            todayKhrAmount
        );
    }

    @Override
    public List<TransactionResponse> getTransactions(String currency, String status) {
        String queryCurrency = (currency == null || currency.trim().isEmpty() || "ALL".equalsIgnoreCase(currency)) ? null : currency.trim().toUpperCase();
        String queryStatus = (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status)) ? null : status.trim().toUpperCase();

        List<Transaction> transactions = transactionRepository.findFilteredTransactions(queryCurrency, queryStatus);
        return transactions.stream()
            .map(this::toResponse)
            .toList();
    }

    private TransactionResponse toResponse(Transaction t) {
        String senderWalletNum = t.getSenderWallet() != null ? t.getSenderWallet().getWalletNumber() : "SYSTEM";
        String senderName = (t.getSenderWallet() != null && t.getSenderWallet().getUser() != null)
            ? t.getSenderWallet().getUser().getFullName() : "SYSTEM";
        String receiverWalletNum = t.getReceiverWallet() != null ? t.getReceiverWallet().getWalletNumber() : "SYSTEM";
        String receiverName = (t.getReceiverWallet() != null && t.getReceiverWallet().getUser() != null)
            ? t.getReceiverWallet().getUser().getFullName() : "SYSTEM";

        return new TransactionResponse(
            t.getId(),
            t.getTransactionNo(),
            senderWalletNum,
            senderName,
            receiverWalletNum,
            receiverName,
            t.getAmount(),
            t.getFee(),
            t.getTotalAmount(),
            t.getNote(),
            t.getTransactionType(),
            t.getCurrency(),
            t.getStatus(),
            t.getCreatedAt()
        );
    }
}
