package com.ewallet.wallet.dto;

import com.ewallet.transaction.dto.TransactionResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class WalletResponse {

    private Long id;
    private Long userId;
    private String walletId;
    private String walletNumber;
    private String fullName;
    private BigDecimal usdBalance;
    private BigDecimal khrBalance;
    private String status;
    private boolean hasPin;
    private List<TransactionResponse> recentTransactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WalletResponse() {
    }

    public WalletResponse(Long id, Long userId, String walletId, String walletNumber, String fullName, BigDecimal usdBalance, BigDecimal khrBalance, String status, boolean hasPin, List<TransactionResponse> recentTransactions, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.walletId = walletId;
        this.walletNumber = walletNumber;
        this.fullName = fullName;
        this.usdBalance = usdBalance;
        this.khrBalance = khrBalance;
        this.status = status;
        this.hasPin = hasPin;
        this.recentTransactions = recentTransactions;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getWalletId() {
        return walletId;
    }

    public void setWalletId(String walletId) {
        this.walletId = walletId;
    }

    public String getWalletNumber() {
        return walletNumber;
    }

    public void setWalletNumber(String walletNumber) {
        this.walletNumber = walletNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public BigDecimal getUsdBalance() {
        return usdBalance;
    }

    public void setUsdBalance(BigDecimal usdBalance) {
        this.usdBalance = usdBalance;
    }

    public BigDecimal getKhrBalance() {
        return khrBalance;
    }

    public void setKhrBalance(BigDecimal khrBalance) {
        this.khrBalance = khrBalance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isHasPin() {
        return hasPin;
    }

    public void setHasPin(boolean hasPin) {
        this.hasPin = hasPin;
    }

    public List<TransactionResponse> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<TransactionResponse> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
