package com.ewallet.admin.dto;

import java.math.BigDecimal;

public class DashboardSummaryResponse {
    private BigDecimal totalUsdBalance;
    private BigDecimal totalKhrBalance;
    private Long totalTransactionsCount;
    private Long todayPaymentsCount;
    private BigDecimal todayPaymentsAmountUsd;
    private BigDecimal todayPaymentsAmountKhr;

    public DashboardSummaryResponse() {}

    public DashboardSummaryResponse(BigDecimal totalUsdBalance, BigDecimal totalKhrBalance, Long totalTransactionsCount, Long todayPaymentsCount, BigDecimal todayPaymentsAmountUsd, BigDecimal todayPaymentsAmountKhr) {
        this.totalUsdBalance = totalUsdBalance;
        this.totalKhrBalance = totalKhrBalance;
        this.totalTransactionsCount = totalTransactionsCount;
        this.todayPaymentsCount = todayPaymentsCount;
        this.todayPaymentsAmountUsd = todayPaymentsAmountUsd;
        this.todayPaymentsAmountKhr = todayPaymentsAmountKhr;
    }

    public BigDecimal getTotalUsdBalance() {
        return totalUsdBalance;
    }

    public void setTotalUsdBalance(BigDecimal totalUsdBalance) {
        this.totalUsdBalance = totalUsdBalance;
    }

    public BigDecimal getTotalKhrBalance() {
        return totalKhrBalance;
    }

    public void setTotalKhrBalance(BigDecimal totalKhrBalance) {
        this.totalKhrBalance = totalKhrBalance;
    }

    public Long getTotalTransactionsCount() {
        return totalTransactionsCount;
    }

    public void setTotalTransactionsCount(Long totalTransactionsCount) {
        this.totalTransactionsCount = totalTransactionsCount;
    }

    public Long getTodayPaymentsCount() {
        return todayPaymentsCount;
    }

    public void setTodayPaymentsCount(Long todayPaymentsCount) {
        this.todayPaymentsCount = todayPaymentsCount;
    }

    public BigDecimal getTodayPaymentsAmountUsd() {
        return todayPaymentsAmountUsd;
    }

    public void setTodayPaymentsAmountUsd(BigDecimal todayPaymentsAmountUsd) {
        this.todayPaymentsAmountUsd = todayPaymentsAmountUsd;
    }

    public BigDecimal getTodayPaymentsAmountKhr() {
        return todayPaymentsAmountKhr;
    }

    public void setTodayPaymentsAmountKhr(BigDecimal todayPaymentsAmountKhr) {
        this.todayPaymentsAmountKhr = todayPaymentsAmountKhr;
    }
}
