package com.ewallet.admin.service;

import com.ewallet.admin.dto.DashboardSummaryResponse;
import com.ewallet.transaction.dto.TransactionResponse;
import java.util.List;

public interface AdminDashboardService {
    DashboardSummaryResponse getDashboardSummary();
    List<TransactionResponse> getTransactions(String currency, String status);
}
