package com.ewallet.billsplit.controller;

import com.ewallet.billsplit.dto.CreateSplitBillRequest;
import com.ewallet.billsplit.dto.SplitBillResponse;
import com.ewallet.billsplit.service.SplitBillService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/split-bills")
@Tag(name = "Split Bill", description = "Endpoints for creating and managing bill splits")
public class SplitBillController {

    private final SplitBillService splitBillService;
    private final UserRepository userRepository;

    public SplitBillController(SplitBillService splitBillService, UserRepository userRepository) {
        this.splitBillService = splitBillService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Operation(summary = "Create a new split bill")
    public ResponseEntity<SplitBillResponse> createSplitBill(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @Valid @RequestBody CreateSplitBillRequest request
    ) {
        Long creatorId = resolveUserId(authentication, userId);
        SplitBillResponse response = splitBillService.createSplitBill(creatorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get split bill details")
    public ResponseEntity<SplitBillResponse> getSplitBill(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Long userId
    ) {
        Long currentUserId = resolveUserId(authentication, userId);
        SplitBillResponse response = splitBillService.getSplitBill(currentUserId, id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List all split bills for user")
    public ResponseEntity<List<SplitBillResponse>> listSplitBills(
            Authentication authentication,
            @RequestParam(required = false) Long userId
    ) {
        Long currentUserId = resolveUserId(authentication, userId);
        List<SplitBillResponse> response = splitBillService.getSplitBillsForUser(currentUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Pay user's share for split bill")
    public ResponseEntity<SplitBillResponse> payShare(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Long userId
    ) {
        Long currentUserId = resolveUserId(authentication, userId);
        SplitBillResponse response = splitBillService.payMemberShare(currentUserId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/remind")
    @Operation(summary = "Remind pending members of split bill")
    public ResponseEntity<Map<String, String>> remindPending(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Long userId
    ) {
        Long currentUserId = resolveUserId(authentication, userId);
        splitBillService.sendReminders(currentUserId, id);
        return ResponseEntity.ok(Map.of("message", "Reminders sent successfully"));
    }

    private Long resolveUserId(Authentication authentication, Long fallbackUserId) {
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        if (authentication != null && authentication.getName() != null) {
            User u = userRepository.findByPhoneNumber(authentication.getName()).orElse(null);
            if (u != null) return u.getId();
        }
        if (fallbackUserId != null) {
            return fallbackUserId;
        }
        return 1L;
    }
}
