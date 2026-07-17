package com.ewallet.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {
    private String transactionNo;
    private String senderWalletNo;
    private String receiverWalletNo;
    private BigDecimal amount;
    private String currency;
    private BigDecimal fee;
    private String status;
    private LocalDateTime createdAt;

    public PaymentResponse() {}

    public PaymentResponse(String transactionNo, String senderWalletNo, String receiverWalletNo, BigDecimal amount, String currency, BigDecimal fee, String status, LocalDateTime createdAt) {
        this.transactionNo = transactionNo;
        this.senderWalletNo = senderWalletNo;
        this.receiverWalletNo = receiverWalletNo;
        this.amount = amount;
        this.currency = currency;
        this.fee = fee;
        this.status = status;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
