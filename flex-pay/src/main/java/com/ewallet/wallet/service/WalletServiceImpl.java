package com.ewallet.wallet.service;

import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.dto.WalletResponse;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.transaction.dto.TransactionResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Random;

@Service
@Transactional
public class WalletServiceImpl implements WalletService {

    private static final int PIN_MAX_ATTEMPTS = 5;
    private static final int PIN_LOCK_MINUTES = 10;

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public WalletServiceImpl(
        UserRepository userRepository,
        WalletRepository walletRepository,
        TransactionRepository transactionRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWalletForUser(userId));
        return toResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletResponse> getAllWallets() {
        return walletRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Wallet createWalletForUser(Long userId) {
        User user = findUserOrThrow(userId);

        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet wallet = new Wallet();
                    wallet.setUser(user);
                    wallet.setWalletNumber(generateUniqueWalletNumber());
                    wallet.setBalance(BigDecimal.ZERO);
                    wallet.setCurrency("USD");
                    wallet.setStatus("ACTIVE");
                    wallet.setWalletId("PENDING");

                    wallet = walletRepository.save(wallet);
                    wallet.setWalletId(String.format("FW%06d", wallet.getId()));
                    return walletRepository.save(wallet);
                });
    }

    @Override
    public void createPin(Long userId, String pin, String confirmPin) {
        if (!pin.equals(confirmPin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PINs do not match");
        }

        User user = findUserOrThrow(userId);

        user.setPinHash(passwordEncoder.encode(pin));
        user.setPinCreated(true);
        user.setPinFailedAttempts(0);
        user.setPinLockExpiresAt(null);
        userRepository.save(user);
    }

    @Override
    public boolean verifyPin(Long userId, String pin) {
        User user = findUserOrThrow(userId);

        if (!Boolean.TRUE.equals(user.getPinCreated()) || user.getPinHash() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN is not set");
        }

        if (isPinLocked(user)) {
            throw new ResponseStatusException(
                HttpStatus.LOCKED,
                "PIN entry is locked until " + user.getPinLockExpiresAt()
            );
        }

        if (passwordEncoder.matches(pin, user.getPinHash())) {
            user.setPinFailedAttempts(0);
            user.setPinLockExpiresAt(null);
            user.setPinVerified(true);
            user.setLastPinVerifiedAt(LocalDateTime.now());
            userRepository.save(user);
            return true;
        }

        int failedAttempts = user.getPinFailedAttempts() + 1;
        user.setPinFailedAttempts(failedAttempts);

        if (failedAttempts >= PIN_MAX_ATTEMPTS) {
            user.setPinLockExpiresAt(LocalDateTime.now().plusMinutes(PIN_LOCK_MINUTES));
            user.setPinFailedAttempts(0);
        }

        userRepository.save(user);
        return false;
    }

    @Override
    public void changePin(Long userId, String currentPin, String newPin, String confirmPin) {
        if (!newPin.equals(confirmPin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New PINs do not match");
        }

        if (!verifyPin(userId, currentPin)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid current PIN");
        }

        User user = findUserOrThrow(userId);
        user.setPinHash(passwordEncoder.encode(newPin));
        user.setPinCreated(true);
        user.setPinFailedAttempts(0);
        user.setPinLockExpiresAt(null);
        userRepository.save(user);
    }

    private boolean isPinLocked(User user) {
        return user.getPinLockExpiresAt() != null && user.getPinLockExpiresAt().isAfter(LocalDateTime.now());
    }

    private String generateUniqueWalletNumber() {
        Random random = new Random();
        for (int attempts = 0; attempts < 1000; attempts++) {
            String walletNumber = String.format("%06d", random.nextInt(1_000_000));
            if (!walletRepository.existsByWalletNumber(walletNumber)) {
                return walletNumber;
            }
        }
        throw new IllegalStateException("Unable to generate unique wallet number");
    }

    private User findUserOrThrow(Long userId) {
        Objects.requireNonNull(userId, "User ID must not be null");
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private WalletResponse toResponse(Wallet wallet) {
        List<Transaction> transactions = transactionRepository.findRecentTransactionsByWalletId(wallet.getId());
        List<TransactionResponse> recentResponses = transactions.stream()
                .limit(10)
                .map(this::toTransactionResponse)
                .toList();

        return new WalletResponse(
                wallet.getId(),
                wallet.getUser().getId(),
                wallet.getWalletId(),
                wallet.getWalletNumber(),
                wallet.getUser().getFullName(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getStatus(),
                Boolean.TRUE.equals(wallet.getUser().getPinCreated()),
                recentResponses,
                wallet.getCreatedAt(),
                wallet.getUpdatedAt()
        );
    }

    private TransactionResponse toTransactionResponse(Transaction t) {
        String senderWalletNum = t.getSenderWallet() != null ? t.getSenderWallet().getWalletNumber() : "SYSTEM";
        String senderName = t.getSenderWallet() != null && t.getSenderWallet().getUser() != null
                ? t.getSenderWallet().getUser().getFullName() : "SYSTEM";
        String receiverWalletNum = t.getReceiverWallet() != null ? t.getReceiverWallet().getWalletNumber() : "SYSTEM";
        String receiverName = t.getReceiverWallet() != null && t.getReceiverWallet().getUser() != null
                ? t.getReceiverWallet().getUser().getFullName() : "SYSTEM";

        return new TransactionResponse(
                t.getId(),
                t.getReferenceNumber(),
                senderWalletNum,
                senderName,
                receiverWalletNum,
                receiverName,
                t.getAmount(),
                t.getFee(),
                t.getTotalAmount(),
                t.getNote(),
                t.getTransactionType(),
                t.getStatus(),
                t.getCreatedAt()
        );
    }
}
