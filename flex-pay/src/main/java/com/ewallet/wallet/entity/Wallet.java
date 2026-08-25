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

    @Column(name = "usd_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal usdBalance = BigDecimal.ZERO;

    @Column(name = "savings_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal savingsBalance = new BigDecimal("48778.50");

    @Column(name = "khr_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal khrBalance = BigDecimal.ZERO;

    @Column(name = "savings_khr_balance", precision = 19, scale = 2)
    private BigDecimal savingsKhrBalance = new BigDecimal("500000.00");

    @Column(name = "goal_usd_balance", precision = 19, scale = 2)
    private BigDecimal goalUsdBalance = new BigDecimal("250.00");

    @Column(name = "goal_khr_balance", precision = 19, scale = 2)
    private BigDecimal goalKhrBalance = new BigDecimal("1000000.00");

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

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getWalletId() { return walletId; }
    public void setWalletId(String walletId) { this.walletId = walletId; }

    public String getWalletNumber() { return walletNumber; }
    public void setWalletNumber(String walletNumber) { this.walletNumber = walletNumber; }

    public BigDecimal getUsdBalance() { return usdBalance; }
    public void setUsdBalance(BigDecimal usdBalance) { this.usdBalance = usdBalance; }

    public BigDecimal getSavingsBalance() { return savingsBalance; }
    public void setSavingsBalance(BigDecimal savingsBalance) { this.savingsBalance = savingsBalance; }

    public BigDecimal getSavingsKhrBalance() {
        return savingsKhrBalance != null ? savingsKhrBalance : new BigDecimal("500000.00");
    }
    public void setSavingsKhrBalance(BigDecimal savingsKhrBalance) { this.savingsKhrBalance = savingsKhrBalance; }

    public BigDecimal getGoalUsdBalance() {
        return goalUsdBalance != null ? goalUsdBalance : new BigDecimal("250.00");
    }
    public void setGoalUsdBalance(BigDecimal goalUsdBalance) { this.goalUsdBalance = goalUsdBalance; }

    public BigDecimal getGoalKhrBalance() {
        return goalKhrBalance != null ? goalKhrBalance : new BigDecimal("1000000.00");
    }
    public void setGoalKhrBalance(BigDecimal goalKhrBalance) { this.goalKhrBalance = goalKhrBalance; }

    public BigDecimal getKhrBalance() { return khrBalance; }
    public void setKhrBalance(BigDecimal khrBalance) { this.khrBalance = khrBalance; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // NO MORE BROKEN getAccountHolderName() METHOD!
}