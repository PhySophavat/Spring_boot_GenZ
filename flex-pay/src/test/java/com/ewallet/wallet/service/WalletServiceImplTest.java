package com.ewallet.wallet.service;

import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import com.ewallet.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.ewallet.savings.repository.SavingGoalRepository savingGoalRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(42L);
        user.setFullName("Alice Test");
        user.setPhoneNumber("+85510000001");
        user.setEmail("alice@test.com");
        user.setAccountStatus("ACTIVE");
    }

    @Test
    @DisplayName("New user: walletId = FW + walletNumber and walletNumber is exactly 6 digits")
    void createWalletForUser_newUser_assignsFwPrefixedSixDigitId() {
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(walletRepository.findByUserId(42L)).thenReturn(Optional.empty());
        when(walletRepository.existsByWalletNumber(any())).thenReturn(false);
        // Echo the wallet argument through save() so we can inspect what was persisted.
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        Wallet result = walletService.createWalletForUser(42L);

        assertThat(result).isNotNull();
        assertThat(result.getWalletNumber()).matches("^\\d{6}$");
        assertThat(result.getUsdBalance().compareTo(new java.math.BigDecimal("100.00"))).isZero();
        assertThat(result.getKhrBalance().compareTo(new java.math.BigDecimal("10000.00"))).isZero();
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getUser()).isSameAs(user);
    }

    @Test
    @DisplayName("New user: walletRepository.save is called exactly once (no PENDING double-save)")
    void createWalletForUser_newUser_savesExactlyOnce() {
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(walletRepository.findByUserId(42L)).thenReturn(Optional.empty());
        when(walletRepository.existsByWalletNumber(any())).thenReturn(false);
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        walletService.createWalletForUser(42L);

        ArgumentCaptor<Wallet> captor = ArgumentCaptor.forClass(Wallet.class);
        verify(walletRepository, times(1)).save(captor.capture());
        Wallet persisted = captor.getValue();
        // The wallet handed to save must already carry the final walletId,
        // not the placeholder "PENDING".
        assertThat(persisted.getWalletId()).isEqualTo("FW" + persisted.getWalletNumber());
        assertThat(persisted.getWalletId()).isNotEqualTo("PENDING");
    }

    @Test
    @DisplayName("Existing user: returns existing wallet and does not save")
    void createWalletForUser_existingUser_returnsExistingWalletWithoutSaving() {
        Wallet existing = new Wallet();
        existing.setId(7L);
        existing.setUser(user);
        existing.setWalletNumber("123456");
        existing.setWalletId("FW123456");
        existing.setUsdBalance(new java.math.BigDecimal("10.00"));
        existing.setKhrBalance(java.math.BigDecimal.ZERO);
        existing.setStatus("ACTIVE");

        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(walletRepository.findByUserId(42L)).thenReturn(Optional.of(existing));

        Wallet result = walletService.createWalletForUser(42L);

        assertThat(result).isSameAs(existing);
        verify(walletRepository, never()).save(any(Wallet.class));
        verify(walletRepository, never()).existsByWalletNumber(any());
    }

    @Test
    @DisplayName("Missing user: throws ResponseStatusException 404")
    void createWalletForUser_missingUser_throws404() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions
            .assertThatThrownBy(() -> walletService.createWalletForUser(99L))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
            .hasMessageContaining("User not found");

        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    @DisplayName("Internal Transfer: Main to Savings USD transfers balance atomically and preserves total")
    void transferBetweenWallets_mainToSavingsUSD_successfullyTransfersAndPreservesTotal() {
        Wallet wallet = new Wallet();
        wallet.setId(10L);
        wallet.setUser(user);
        wallet.setWalletNumber("882199");
        wallet.setWalletId("FW882199");
        wallet.setUsdBalance(new java.math.BigDecimal("500.00"));
        wallet.setSavingsBalance(new java.math.BigDecimal("100.00"));
        wallet.setKhrBalance(new java.math.BigDecimal("2000000.00"));
        wallet.setSavingsKhrBalance(new java.math.BigDecimal("500000.00"));

        when(walletRepository.findByUserIdWithLock(42L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        com.ewallet.wallet.dto.WalletResponse resp = walletService.transferBetweenWallets(
            42L, "MAIN", "SAVINGS", new java.math.BigDecimal("100.00"), "USD"
        );

        assertThat(resp.getUsdBalance().compareTo(new java.math.BigDecimal("400.00"))).isZero();
        assertThat(resp.getSavingsBalance().compareTo(new java.math.BigDecimal("200.00"))).isZero();
        assertThat(resp.getKhrBalance().compareTo(new java.math.BigDecimal("2000000.00"))).isZero();
        assertThat(resp.getSavingsKhrBalance().compareTo(new java.math.BigDecimal("500000.00"))).isZero();

        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Internal Transfer: Insufficient balance in source wallet throws 400 Bad Request")
    void transferBetweenWallets_insufficientBalance_throwsBadRequest() {
        Wallet wallet = new Wallet();
        wallet.setId(10L);
        wallet.setUser(user);
        wallet.setWalletNumber("882199");
        wallet.setWalletId("FW882199");
        wallet.setUsdBalance(new java.math.BigDecimal("20.00"));
        wallet.setSavingsBalance(new java.math.BigDecimal("0.00"));

        when(walletRepository.findByUserIdWithLock(42L)).thenReturn(Optional.of(wallet));

        org.assertj.core.api.Assertions
            .assertThatThrownBy(() -> walletService.transferBetweenWallets(
                42L, "MAIN", "SAVINGS", new java.math.BigDecimal("50.00"), "USD"
            ))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
            .hasMessageContaining("Insufficient balance");

        verify(walletRepository, never()).save(any());
    }
}
