package com.ewallet.transaction.controller;

import com.ewallet.transaction.dto.TransactionResponse;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*") // Allow Flutter to connect
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @GetMapping("/history")
    public ResponseEntity<?> getTransactionHistory() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> createTransfer(@RequestBody Map<String, Object> request) {
        try {
            // 1. Extract data
            Long senderWalletId = Long.parseLong(request.get("senderWalletId").toString());
            Long receiverWalletId = Long.parseLong(request.get("receiverWalletId").toString());
            
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String note = (String) request.get("note");
            BigDecimal fee = new BigDecimal(request.getOrDefault("fee", "0.00").toString());
            
            // 2. Fetch wallets
            Wallet senderWallet = walletRepository.findById(senderWalletId)
                    .orElseThrow(() -> new RuntimeException("Sender wallet not found"));
            Wallet receiverWallet = walletRepository.findById(receiverWalletId)
                    .orElseThrow(() -> new RuntimeException("Receiver wallet not found"));

            // 3. Create and save transaction
            Transaction transaction = new Transaction();
            transaction.setTransactionNo("TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            transaction.setSenderWallet(senderWallet);
            transaction.setReceiverWallet(receiverWallet);
            transaction.setAmount(amount);
            transaction.setFee(fee);
            transaction.setTotalAmount(amount.add(fee));
            // Instead of using the note from request
            transaction.setNote("Paid by " + senderWallet.getUser().getFullName());
            transaction.setCurrency("USD");
            transaction.setTransactionType("TRANSFER");
            transaction.setCreatedAt(LocalDateTime.now());
            transaction.setStatus("SUCCESS");
            
            Transaction savedTransaction = transactionRepository.save(transaction);
            
            // 4. Return a custom Map (FIXES Hibernate serialization error)
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedTransaction.getId());
            response.put("transactionNo", savedTransaction.getTransactionNo());
            response.put("amount", savedTransaction.getAmount());
            response.put("fee", savedTransaction.getFee());
            response.put("totalAmount", savedTransaction.getTotalAmount());
            response.put("note", savedTransaction.getNote());
            response.put("status", savedTransaction.getStatus());
            response.put("createdAt", savedTransaction.getCreatedAt());
            
            // Add sender/receiver info (getting name from User entity)
            Map<String, Object> sender = new HashMap<>();
            sender.put("id", senderWallet.getId());
            sender.put("name", senderWallet.getUser() != null ? senderWallet.getUser().getFullName() : "Unknown");
            sender.put("walletNumber", senderWallet.getWalletNumber());
            
            Map<String, Object> receiver = new HashMap<>();
            receiver.put("id", receiverWallet.getId());
            receiver.put("name", receiverWallet.getUser() != null ? receiverWallet.getUser().getFullName() : "Unknown");
            receiver.put("walletNumber", receiverWallet.getWalletNumber());
            
            response.put("sender", sender);
            response.put("receiver", receiver);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
}