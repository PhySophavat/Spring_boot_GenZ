package com.ewallet.payment.service;

import com.ewallet.payment.dto.SendMoneyRequest;
import com.ewallet.payment.dto.SendMoneyResponse;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.notification.entity.Notification;
import com.ewallet.notification.repository.NotificationRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;

import org.springframework.http.HttpStatus;
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

    public PaymentServiceImpl(
        WalletRepository walletRepository,
        TransactionRepository transactionRepository,
        NotificationRepository notificationRepository,
        UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
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

        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }

        // Perform balance updates
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // Create transaction history record
        String referenceNumber = generateReferenceNumber();
        Transaction transaction = new Transaction();
        transaction.setReferenceNumber(referenceNumber);
        transaction.setSenderWallet(senderWallet);
        transaction.setReceiverWallet(receiverWallet);
        transaction.setAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setTotalAmount(amount);
        transaction.setNote(request.getNote());
        transaction.setTransactionType("TRANSFER");
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
            senderWallet.getBalance(),
            receiverWallet.getBalance(),
            "SUCCESS"
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
