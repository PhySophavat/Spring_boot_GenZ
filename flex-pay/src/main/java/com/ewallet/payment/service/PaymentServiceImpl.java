package com.ewallet.payment.service;

import com.ewallet.payment.dto.PaymentRequest;
import com.ewallet.payment.dto.PaymentResponse;
import com.ewallet.payment.dto.SendMoneyRequest;
import com.ewallet.payment.dto.SendMoneyResponse;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.notification.entity.Notification;
import com.ewallet.notification.repository.NotificationRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.entity.UserPublicToken;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.user.repository.UserPublicTokenRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserPublicTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    public PaymentServiceImpl(
        WalletRepository walletRepository,
        TransactionRepository transactionRepository,
        NotificationRepository notificationRepository,
        UserRepository userRepository,
        UserPublicTokenRepository tokenRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public SendMoneyResponse sendMoney(Long senderUserId, SendMoneyRequest request) {
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));

        Wallet receiverWallet = walletRepository.findByWalletNumber(request.getReceiverWalletNumber())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send money to yourself");
        }

        // Lock wallets in deterministic order
        Wallet firstLock, secondLock;
        if (senderWallet.getId() < receiverWallet.getId()) {
            firstLock = walletRepository.findByWalletNumberWithLock(senderWallet.getWalletNumber())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));
            secondLock = walletRepository.findByWalletNumberWithLock(receiverWallet.getWalletNumber())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));
        } else {
            firstLock = walletRepository.findByWalletNumberWithLock(receiverWallet.getWalletNumber())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));
            secondLock = walletRepository.findByWalletNumberWithLock(senderWallet.getWalletNumber())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));
        }

        senderWallet = senderWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;
        receiverWallet = receiverWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;

        if (!"ACTIVE".equals(senderWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender wallet is not active");
        }

        if (!"ACTIVE".equals(receiverWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver wallet is not active");
        }

        BigDecimal amount = request.getAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        if (senderWallet.getUsdBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Main Wallet");
        }

        senderWallet.setUsdBalance(senderWallet.getUsdBalance().subtract(amount));
        receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        String referenceNumber = generateReferenceNumber();
        Transaction transaction = new Transaction();
        transaction.setTransactionNo(referenceNumber);
        transaction.setSenderWallet(senderWallet);
        transaction.setReceiverWallet(receiverWallet);
        transaction.setAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setTotalAmount(amount);
        transaction.setNote(request.getNote());
        transaction.setTransactionType("TRANSFER");
        transaction.setCurrency("USD");
        transaction.setStatus("SUCCESS");

        transactionRepository.save(transaction);

        createNotification(
            senderWallet.getUser(),
            "Money Sent Successfully",
            String.format("You have successfully sent $%s USD to %s (Wallet: %s).",
                amount.setScale(2, BigDecimal.ROUND_HALF_UP),
                receiverWallet.getUser().getFullName(),
                receiverWallet.getWalletNumber())
        );

        createNotification(
            receiverWallet.getUser(),
            "Money Received",
            String.format("You have received $%s USD from %s (Wallet: %s).",
                amount.setScale(2, BigDecimal.ROUND_HALF_UP),
                senderWallet.getUser().getFullName(),
                senderWallet.getWalletNumber())
        );

        return new SendMoneyResponse(
            referenceNumber,
            senderWallet.getUsdBalance(),
            receiverWallet.getUsdBalance(),
            "SUCCESS"
        );
    }

    @Override
    public PaymentResponse processPayment(Long senderUserId, PaymentRequest request) {
        String currency = request.getCurrency().toUpperCase();
        if (!"USD".equals(currency) && !"KHR".equals(currency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Currency: Must be USD or KHR");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than 0");
        }

        String walletType = request.getWalletType() != null ? request.getWalletType().toUpperCase() : "MAIN";

        // Fetch Sender User
        User sender = userRepository.findById(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        // Verify PIN if set and provided
        if (Boolean.TRUE.equals(sender.getPinCreated()) && sender.getPinHash() != null) {
            if (sender.getPinLockExpiresAt() != null && sender.getPinLockExpiresAt().isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.LOCKED, "PIN entry is locked due to multiple failed attempts");
            }

            if (request.getPin() != null && !request.getPin().isEmpty()) {
                if (!passwordEncoder.matches(request.getPin(), sender.getPinHash())) {
                    int failedAttempts = sender.getPinFailedAttempts() + 1;
                    sender.setPinFailedAttempts(failedAttempts);
                    if (failedAttempts >= 5) {
                        sender.setPinLockExpiresAt(LocalDateTime.now().plusMinutes(10));
                        sender.setPinFailedAttempts(0);
                    }
                    userRepository.save(sender);
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid PIN");
                }
                sender.setPinFailedAttempts(0);
                sender.setPinLockExpiresAt(null);
                userRepository.save(sender);
            }
        }

        // Find Sender Wallet
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender Wallet Not Found"));

        // Find Receiver
        User receiver = null;
        Wallet receiverWallet = null;

        if (request.getReceiverToken() != null && !request.getReceiverToken().isBlank()) {
            UserPublicToken receiverToken = tokenRepository.findByPublicTokenAndActiveTrue(request.getReceiverToken())
                .orElse(null);
            if (receiverToken != null) {
                receiver = receiverToken.getUser();
            }
        }

        if (receiver == null && request.getReceiverId() != null) {
            receiver = userRepository.findById(request.getReceiverId()).orElse(null);
        }

        if (receiver == null && request.getReceiverWalletNumber() != null) {
            receiverWallet = walletRepository.findByWalletNumber(request.getReceiverWalletNumber()).orElse(null);
            if (receiverWallet != null) {
                receiver = receiverWallet.getUser();
            }
        }

        if (receiver == null) {
            // Fallback to first other user for demo flexibility
            receiver = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(senderUserId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
        }

        if (receiverWallet == null) {
            receiverWallet = walletRepository.findByUserId(receiver.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));
        }

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send payment to yourself");
        }

        if (!"ACTIVE".equals(senderWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender wallet is locked");
        }
        if (!"ACTIVE".equals(receiverWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver wallet is locked");
        }

        BigDecimal remainingBalance;

        // Perform balance deduction strictly based on selected wallet type & currency
        if ("SAVING".equals(walletType)) {
            if ("USD".equals(currency)) {
                if (senderWallet.getSavingsBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Saving Wallet");
                }
                senderWallet.setSavingsBalance(senderWallet.getSavingsBalance().subtract(amount));
                receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));
                remainingBalance = senderWallet.getSavingsBalance();
            } else {
                if (senderWallet.getSavingsKhrBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Saving Wallet");
                }
                senderWallet.setSavingsKhrBalance(senderWallet.getSavingsKhrBalance().subtract(amount));
                receiverWallet.setKhrBalance(receiverWallet.getKhrBalance().add(amount));
                remainingBalance = senderWallet.getSavingsKhrBalance();
            }
        } else if ("GOAL".equals(walletType)) {
            if ("USD".equals(currency)) {
                if (senderWallet.getGoalUsdBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Goal Wallet");
                }
                senderWallet.setGoalUsdBalance(senderWallet.getGoalUsdBalance().subtract(amount));
                receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));
                remainingBalance = senderWallet.getGoalUsdBalance();
            } else {
                if (senderWallet.getGoalKhrBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Goal Wallet");
                }
                senderWallet.setGoalKhrBalance(senderWallet.getGoalKhrBalance().subtract(amount));
                receiverWallet.setKhrBalance(receiverWallet.getKhrBalance().add(amount));
                remainingBalance = senderWallet.getGoalKhrBalance();
            }
        } else { // MAIN
            if ("USD".equals(currency)) {
                if (senderWallet.getUsdBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Main Wallet");
                }
                senderWallet.setUsdBalance(senderWallet.getUsdBalance().subtract(amount));
                receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));
                remainingBalance = senderWallet.getUsdBalance();
            } else {
                if (senderWallet.getKhrBalance().compareTo(amount) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance in Main Wallet");
                }
                senderWallet.setKhrBalance(senderWallet.getKhrBalance().subtract(amount));
                receiverWallet.setKhrBalance(receiverWallet.getKhrBalance().add(amount));
                remainingBalance = senderWallet.getKhrBalance();
            }
        }

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        String txNo = generateReferenceNumber();
        Transaction transaction = new Transaction();
        transaction.setTransactionNo(txNo);
        transaction.setSenderWallet(senderWallet);
        transaction.setReceiverWallet(receiverWallet);
        transaction.setAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setTotalAmount(amount);
        transaction.setNote(request.getPurpose() != null && !request.getPurpose().isBlank() ? request.getPurpose() : "Payment from " + walletType + " Wallet");
        transaction.setTransactionType("PAYMENT");
        transaction.setCurrency(currency);
        transaction.setStatus("SUCCESS");
        transactionRepository.save(transaction);

        String currSymbol = "USD".equals(currency) ? "$" : "៛";
        createNotification(
            sender,
            "Payment Sent Successfully",
            String.format("You paid %s%s %s from %s Wallet to %s",
                currSymbol, amount.toPlainString(), currency, walletType, receiver.getFullName())
        );
        createNotification(
            receiver,
            "Payment Received",
            String.format("You received %s%s %s from %s",
                currSymbol, amount.toPlainString(), currency, sender.getFullName())
        );

        String sourceWalletDisplay = walletType.substring(0, 1).toUpperCase() + walletType.substring(1).toLowerCase() + " Wallet";

        return new PaymentResponse(
            txNo,
            senderWallet.getWalletNumber(),
            receiverWallet.getWalletNumber(),
            receiver.getFullName(),
            sourceWalletDisplay,
            amount,
            currency,
            BigDecimal.ZERO,
            request.getPurpose(),
            "SUCCESS",
            remainingBalance,
            transaction.getCreatedAt() != null ? transaction.getCreatedAt() : LocalDateTime.now()
        );
    }

    private String generateReferenceNumber() {
        Random random = new Random();
        int suffix = 10000 + random.nextInt(90000);
        return "FP-" + System.currentTimeMillis() + "-" + suffix;
    }

    private void createNotification(User user, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }
}
