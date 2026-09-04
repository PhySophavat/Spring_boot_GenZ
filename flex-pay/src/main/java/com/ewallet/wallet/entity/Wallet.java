package com.ewallet.wallet.entity;

import com.ewallet.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "wallet_id", nullable = false, unique = true, length = 50)
    private String walletId;

    @Column(name = "wallet_number", nullable = false, unique = true, length = 6)
    private String walletNumber;

    // --- Main Wallet Balances (USD & KHR) ---
    @Column(name = "usd_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal usdBalance = BigDecimal.ZERO;

    @Column(name = "khr_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal khrBalance = BigDecimal.ZERO;

    // --- Savings Wallet Balances (USD & KHR) ---
    @Column(name = "savings_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal savingsBalance = BigDecimal.ZERO;

    @Column(name = "savings_khr_balance", precision = 19, scale = 2)
    private BigDecimal savingsKhrBalance = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // --- Helper Methods for Currency & Wallet Type Operations ---
    public BigDecimal getBalance(String currency, String walletType) {
        boolean isSavings = walletType != null && walletType.toUpperCase().contains("SAV");
        boolean isKhr = currency != null && currency.equalsIgnoreCase("KHR");

        if (isSavings) {
            return isKhr ? getSavingsKhrBalance() : getSavingsBalance();
        } else {
            return isKhr ? getKhrBalance() : getUsdBalance();
        }
    }

    public void deductBalance(String currency, String walletType, BigDecimal amount) {
        boolean isSavings = walletType != null && walletType.toUpperCase().contains("SAV");
        boolean isKhr = currency != null && currency.equalsIgnoreCase("KHR");

        if (isSavings) {
            if (isKhr) {
                this.savingsKhrBalance = getSavingsKhrBalance().subtract(amount);
            } else {
                this.savingsBalance = getSavingsBalance().subtract(amount);
            }
        } else {
            if (isKhr) {
                this.khrBalance = getKhrBalance().subtract(amount);
            } else {
                this.usdBalance = getUsdBalance().subtract(amount);
            }
        }
    }

    public void creditBalance(String currency, String walletType, BigDecimal amount) {
        boolean isSavings = walletType != null && walletType.toUpperCase().contains("SAV");
        boolean isKhr = currency != null && currency.equalsIgnoreCase("KHR");

        if (isSavings) {
            if (isKhr) {
                this.savingsKhrBalance = getSavingsKhrBalance().add(amount);
            } else {
                this.savingsBalance = getSavingsBalance().add(amount);
            }
        } else {
            if (isKhr) {
                this.khrBalance = getKhrBalance().add(amount);
            } else {
                this.usdBalance = getUsdBalance().add(amount);
            }
        }
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getWalletId() { return walletId; }
    public void setWalletId(String walletId) { this.walletId = walletId; }

    public String getWalletNumber() { return walletNumber; }
    public void setWalletNumber(String walletNumber) { this.walletNumber = walletNumber; }

    public BigDecimal getUsdBalance() {
        return usdBalance != null ? usdBalance : BigDecimal.ZERO;
    }
    public void setUsdBalance(BigDecimal usdBalance) {
        this.usdBalance = usdBalance != null ? usdBalance : BigDecimal.ZERO;
    }

    public BigDecimal getKhrBalance() {
        return khrBalance != null ? khrBalance : BigDecimal.ZERO;
    }
    public void setKhrBalance(BigDecimal khrBalance) {
        this.khrBalance = khrBalance != null ? khrBalance : BigDecimal.ZERO;
    }

    public BigDecimal getSavingsBalance() {
        return savingsBalance != null ? savingsBalance : BigDecimal.ZERO;
    }
    public void setSavingsBalance(BigDecimal savingsBalance) {
        this.savingsBalance = savingsBalance != null ? savingsBalance : BigDecimal.ZERO;
    }

    public BigDecimal getSavingsKhrBalance() {
        return savingsKhrBalance != null ? savingsKhrBalance : BigDecimal.ZERO;
    }
    public void setSavingsKhrBalance(BigDecimal savingsKhrBalance) {
        this.savingsKhrBalance = savingsKhrBalance != null ? savingsKhrBalance : BigDecimal.ZERO;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}