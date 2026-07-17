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
        // Fetch sender and receiver
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender wallet not found"));

        Wallet receiverWallet = walletRepository.findByWalletNumber(request.getReceiverWalletNumber())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send money to yourself");
        }

        // Lock wallets in a deterministic order based on ID to prevent deadlocks
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

        // Re-assign references after acquiring lock
        senderWallet = senderWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;
        receiverWallet = receiverWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;

        // Validations
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }

        // Perform balance updates (Default USD for sendMoney)
        senderWallet.setUsdBalance(senderWallet.getUsdBalance().subtract(amount));
        receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // Create transaction history record
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

        // Generate notifications
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
        // Validate currency
        String currency = request.getCurrency().toUpperCase();
        if (!"USD".equals(currency) && !"KHR".equals(currency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Currency");
        }

        // Validate amount
        BigDecimal amount = request.getAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than 0");
        }

        // Fetch Sender User
        User sender = userRepository.findById(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        // Verify PIN (BCrypt PIN)
        if (!Boolean.TRUE.equals(sender.getPinCreated()) || sender.getPinHash() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN is not set");
        }

        if (sender.getPinLockExpiresAt() != null && sender.getPinLockExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "PIN entry is locked");
        }

        if (!passwordEncoder.matches(request.getPin(), sender.getPinHash())) {
            int failedAttempts = sender.getPinFailedAttempts() + 1;
            sender.setPinFailedAttempts(failedAttempts);
            if (failedAttempts >= 5) {
                sender.setPinLockExpiresAt(LocalDateTime.now().plusMinutes(10));
                sender.setPinFailedAttempts(0);
            }
            userRepository.save(sender);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong PIN");
        }
        sender.setPinFailedAttempts(0);
        sender.setPinLockExpiresAt(null);
        userRepository.save(sender);

        // Find Sender Wallet
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender Wallet Not Found"));

        // Find Receiver via public token
        UserPublicToken receiverToken = tokenRepository.findByPublicTokenAndActiveTrue(request.getReceiverToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver Not Found"));

        User receiver = receiverToken.getUser();
        if (receiver == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver Not Found");
        }

        // Find Receiver Wallet
        Wallet receiverWallet = walletRepository.findByUserId(receiver.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot pay yourself");
        }

        // Check Wallet Status
        if (!"ACTIVE".equals(senderWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender Wallet Locked");
        }
        if (!"ACTIVE".equals(receiverWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver Wallet Locked");
        }

        // Check Balance and deduct
        if ("USD".equals(currency)) {
            if (senderWallet.getUsdBalance().compareTo(amount) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient Balance");
            }
            senderWallet.setUsdBalance(senderWallet.getUsdBalance().subtract(amount));
            receiverWallet.setUsdBalance(receiverWallet.getUsdBalance().add(amount));
        } else {
            if (senderWallet.getKhrBalance().compareTo(amount) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient Balance");
            }
            senderWallet.setKhrBalance(senderWallet.getKhrBalance().subtract(amount));
            receiverWallet.setKhrBalance(receiverWallet.getKhrBalance().add(amount));
        }

        // Save wallets (Optimistic locking via @Version)
        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // Insert Transaction
        String txNo = generateReferenceNumber();
        Transaction transaction = new Transaction();
        transaction.setTransactionNo(txNo);
        transaction.setSenderWallet(senderWallet);
        transaction.setReceiverWallet(receiverWallet);
        transaction.setAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setTotalAmount(amount);
        transaction.setNote("QR payment via token");
        transaction.setTransactionType("PAYMENT");
        transaction.setCurrency(currency);
        transaction.setStatus("SUCCESS");
        transactionRepository.save(transaction);

        // Push Notifications to Sender and Receiver
        String currSymbol = "USD".equals(currency) ? "$" : "៛";
        createNotification(
            sender,
            "Payment Sent Successfully",
            String.format("You paid %s%s to %s", currSymbol, amount.toPlainString(), receiver.getFullName())
        );
        createNotification(
            receiver,
            "Payment Received",
            String.format("You received %s%s from %s", currSymbol, amount.toPlainString(), sender.getFullName())
        );

        return new PaymentResponse(
            txNo,
            senderWallet.getWalletNumber(),
            receiverWallet.getWalletNumber(),
            amount,
            currency,
            BigDecimal.ZERO,
            "SUCCESS",
            transaction.getCreatedAt() != null ? transaction.getCreatedAt() : LocalDateTime.now()
        );
    }

    private String generateReferenceNumber() {
        Random random = new Random();
        int suffix = 1000 + random.nextInt(9000);
        return "TX" + System.currentTimeMillis() + suffix;
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
