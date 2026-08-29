package com.ewallet.billsplit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class CreateSplitBillRequest {

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    private BigDecimal totalAmount;

    private String note;

    private String splitType = "EQUAL"; // EQUAL or CUSTOM

    @NotEmpty(message = "At least one friend must be selected")
    private List<Long> friendIds;

    // Optional map of userId -> amount for CUSTOM split
    private Map<Long, BigDecimal> customShares;

    public CreateSplitBillRequest() {
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getSplitType() {
        return splitType;
    }

    public void setSplitType(String splitType) {
        this.splitType = splitType;
    }

    public List<Long> getFriendIds() {
        return friendIds;
    }

    public void setFriendIds(List<Long> friendIds) {
        this.friendIds = friendIds;
    }

    public Map<Long, BigDecimal> getCustomShares() {
        return customShares;
    }

    public void setCustomShares(Map<Long, BigDecimal> customShares) {
        this.customShares = customShares;
    }
}
