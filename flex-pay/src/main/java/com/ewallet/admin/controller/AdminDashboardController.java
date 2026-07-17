package com.ewallet.admin.controller;

import com.ewallet.admin.dto.DashboardSummaryResponse;
import com.ewallet.admin.service.AdminDashboardService;
import com.ewallet.transaction.dto.TransactionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "Admin dashboard statistics and transaction views")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get overview metrics for admin dashboard")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction lists filtered by currency or status")
    public ResponseEntity<List<TransactionResponse>> getTransactions(
        @RequestParam(required = false) String currency,
        @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(dashboardService.getTransactions(currency, status));
    }
}
