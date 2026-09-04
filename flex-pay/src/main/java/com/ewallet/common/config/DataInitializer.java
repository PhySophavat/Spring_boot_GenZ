package com.ewallet.common.config;

import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            WalletRepository walletRepository,
            TransactionRepository transactionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // 1. Seed User 1: dev (SOPHAVAT PHY)
            User user1 = new User();
            user1.setFullName("dev");
            user1.setPhoneNumber("012345678");
            user1.setEmail("dev@flexpay.com");
            user1.setPasswordHash(passwordEncoder.encode("password123"));
            user1.setPinHash(passwordEncoder.encode("123456"));
            user1.setPinCreated(true);
            user1.setAccountStatus("ACTIVE");
            user1 = userRepository.save(user1);

            Wallet wallet1 = new Wallet();
            wallet1.setUser(user1);
            wallet1.setWalletId("FW497548");
            wallet1.setWalletNumber("497548");
            wallet1.setUsdBalance(new BigDecimal("1000.00"));
            wallet1.setKhrBalance(new BigDecimal("100000.00"));
            wallet1.setSavingsBalance(BigDecimal.ZERO);
            wallet1.setSavingsKhrBalance(BigDecimal.ZERO);
            wallet1.setStatus("ACTIVE");
            wallet1 = walletRepository.save(wallet1);

            // 2. Seed User 2: dev1
            User user2 = new User();
            user2.setFullName("dev1");
            user2.setPhoneNumber("098765432");
            user2.setEmail("dev1@flexpay.com");
            user2.setPasswordHash(passwordEncoder.encode("password123"));
            user2.setPinHash(passwordEncoder.encode("123456"));
            user2.setPinCreated(true);
            user2.setAccountStatus("ACTIVE");
            user2 = userRepository.save(user2);

            Wallet wallet2 = new Wallet();
            wallet2.setUser(user2);
            wallet2.setWalletId("FW653498");
            wallet2.setWalletNumber("653498");
            wallet2.setUsdBalance(new BigDecimal("100.00"));
            wallet2.setKhrBalance(new BigDecimal("10000.00"));
            wallet2.setSavingsBalance(BigDecimal.ZERO);
            wallet2.setSavingsKhrBalance(BigDecimal.ZERO);
            wallet2.setStatus("ACTIVE");
            wallet2 = walletRepository.save(wallet2);

            // Seed Initial Transactions
            Transaction tx1 = new Transaction();
            tx1.setSenderWallet(wallet1);
            tx1.setReceiverWallet(wallet2);
            tx1.setTransactionNo("TX10019283");
            tx1.setAmount(new BigDecimal("15.00"));
            tx1.setFee(BigDecimal.ZERO);
            tx1.setTotalAmount(new BigDecimal("15.00"));
            tx1.setNote("Transfer to dev1");
            tx1.setTransactionType("TRANSFER");
            tx1.setCurrency("USD");
            tx1.setStatus("SUCCESS");

            Transaction tx2 = new Transaction();
            tx2.setSenderWallet(wallet2);
            tx2.setReceiverWallet(wallet1);
            tx2.setTransactionNo("TX10019284");
            tx2.setAmount(new BigDecimal("10.00"));
            tx2.setFee(BigDecimal.ZERO);
            tx2.setTotalAmount(new BigDecimal("10.00"));
            tx2.setNote("Transfer from dev1");
            tx2.setTransactionType("TRANSFER");
            tx2.setCurrency("USD");
            tx2.setStatus("SUCCESS");

            transactionRepository.save(tx1);
            transactionRepository.save(tx2);
        }
    }
}
