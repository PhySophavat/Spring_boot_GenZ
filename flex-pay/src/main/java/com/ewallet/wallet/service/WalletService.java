package com.ewallet.wallet.service;

import com.ewallet.wallet.dto.DepositRequest;
import com.ewallet.wallet.dto.WalletResponse;
import com.ewallet.wallet.entity.Wallet;
import java.util.List;

public interface WalletService {
    WalletResponse getWallet(Long userId);
    List<WalletResponse> getAllWallets();
    Wallet createWalletForUser(Long userId);
    void createPin(Long userId, String pin, String confirmPin);
    boolean verifyPin(Long userId, String pin);
    void changePin(Long userId, String currentPin, String newPin, String confirmPin);
    WalletResponse deposit(Long userId, DepositRequest request);
    WalletResponse transferBetweenWallets(Long userId, String fromType, String toType, java.math.BigDecimal amount, String currency);
    void adminResetIndividualBalances();
}
