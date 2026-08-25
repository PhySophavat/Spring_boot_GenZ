package com.ewallet.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public class PaymentRequest {

    private String receiverToken;
    private Long receiverId;
    private String receiverWalletNumber;
    private String walletType = "MAIN"; // MAIN, SAVING, GOAL

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Currency is required")
    @Pattern(regexp = "^(?i)(USD|KHR)$", message = "Currency must be USD or KHR")
    private String currency;

    private String purpose;
    private String note;
    private String pin;

    public String getReceiverToken() {
        return receiverToken;
    }

    public void setReceiverToken(String receiverToken) {
        this.receiverToken = receiverToken;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverWalletNumber() {
        return receiverWalletNumber;
    }

    public void setReceiverWalletNumber(String receiverWalletNumber) {
        this.receiverWalletNumber = receiverWalletNumber;
    }

    public String getWalletType() {
        return walletType != null ? walletType.toUpperCase() : "MAIN";
    }

    public void setWalletType(String walletType) {
        this.walletType = walletType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency != null ? currency.toUpperCase() : "USD";
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPurpose() {
        return purpose != null ? purpose : note;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getNote() {
        return note != null ? note : purpose;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }
}
