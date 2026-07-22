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
            // Seed Default User: SOPHAVAT PHY
            User user = new User();
            user.setFullName("SOPHAVAT PHY");
            user.setPhoneNumber("012345678");
            user.setEmail("sophavat.phy@flexpay.com");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setPinHash(passwordEncoder.encode("123456"));
            user.setPinCreated(true);
            user.setAccountStatus("ACTIVE");
            user = userRepository.save(user);

            // Seed Wallet
            Wallet wallet = new Wallet();
            wallet.setUser(user);
            wallet.setWalletId("FW8821");
            wallet.setWalletNumber("8821");
            wallet.setUsdBalance(new BigDecimal("230250.00"));
            wallet.setKhrBalance(new BigDecimal("12499988.00"));
            wallet.setStatus("ACTIVE");
            wallet = walletRepository.save(wallet);

            // Seed Transactions
            Transaction tx1 = new Transaction();
            tx1.setSenderWallet(wallet);
            tx1.setReceiverWallet(wallet);
            tx1.setTransactionNo("TX10019283");
            tx1.setAmount(new BigDecimal("15.00"));
            tx1.setFee(BigDecimal.ZERO);
            tx1.setTotalAmount(new BigDecimal("15.00"));
            tx1.setNote("Paid to SOPHAVAT PHY");
            tx1.setTransactionType("TRANSFER");
            tx1.setCurrency("USD");
            tx1.setStatus("SUCCESS");

            Transaction tx2 = new Transaction();
            tx2.setSenderWallet(wallet);
            tx2.setReceiverWallet(wallet);
            tx2.setTransactionNo("TX10019284");
            tx2.setAmount(new BigDecimal("50.00"));
            tx2.setFee(BigDecimal.ZERO);
            tx2.setTotalAmount(new BigDecimal("50.00"));
            tx2.setNote("Paid to PHY SOPHAVAT");
            tx2.setTransactionType("TRANSFER");
            tx2.setCurrency("USD");
            tx2.setStatus("SUCCESS");

            transactionRepository.save(tx1);
            transactionRepository.save(tx2);
        }
    }
}
