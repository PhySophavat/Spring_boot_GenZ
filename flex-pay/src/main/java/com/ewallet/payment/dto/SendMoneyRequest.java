package com.ewallet.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class SendMoneyRequest {

    @NotBlank(message = "Receiver wallet number is required")
    private String receiverWalletNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String note;

    public String getReceiverWalletNumber() {
        return receiverWalletNumber;
    }

    public void setReceiverWalletNumber(String receiverWalletNumber) {
        this.receiverWalletNumber = receiverWalletNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
