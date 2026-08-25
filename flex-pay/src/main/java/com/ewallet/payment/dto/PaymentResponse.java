package com.ewallet.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {
    private String transactionNo;
    private String senderWalletNo;
    private String receiverWalletNo;
    private String receiverName;
    private String sourceWallet;
    private BigDecimal amount;
    private String currency;
    private BigDecimal fee;
    private String purpose;
    private String status;
    private BigDecimal remainingBalance;
    private LocalDateTime createdAt;

    public PaymentResponse() {}

    public PaymentResponse(
        String transactionNo,
        String senderWalletNo,
        String receiverWalletNo,
        String receiverName,
        String sourceWallet,
        BigDecimal amount,
        String currency,
        BigDecimal fee,
        String purpose,
        String status,
        BigDecimal remainingBalance,
        LocalDateTime createdAt
    ) {
        this.transactionNo = transactionNo;
        this.senderWalletNo = senderWalletNo;
        this.receiverWalletNo = receiverWalletNo;
        this.receiverName = receiverName;
        this.sourceWallet = sourceWallet;
        this.amount = amount;
        this.currency = currency;
        this.fee = fee;
        this.purpose = purpose;
        this.status = status;
        this.remainingBalance = remainingBalance;
        this.createdAt = createdAt;
    }

    public String getTransactionNo() {
        return transactionNo;
    }

    public void setTransactionNo(String transactionNo) {
        this.transactionNo = transactionNo;
    }

    public String getSenderWalletNo() {
        return senderWalletNo;
    }

    public void setSenderWalletNo(String senderWalletNo) {
        this.senderWalletNo = senderWalletNo;
    }

    public String getReceiverWalletNo() {
        return receiverWalletNo;
    }

    public void setReceiverWalletNo(String receiverWalletNo) {
        this.receiverWalletNo = receiverWalletNo;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getSourceWallet() {
        return sourceWallet;
    }

    public void setSourceWallet(String sourceWallet) {
        this.sourceWallet = sourceWallet;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
