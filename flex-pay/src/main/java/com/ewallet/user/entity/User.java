package com.ewallet.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", nullable = false, unique = true, length = 20)
    private String phoneNumber;

    @Column(unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    @Column(name = "pin_created", nullable = false)
    private Boolean pinCreated = false;

    @Column(name = "pin_failed_attempts", nullable = false)
    private Integer pinFailedAttempts = 0;

    @Column(name = "pin_lock_expires_at")
    private LocalDateTime pinLockExpiresAt;

    @Column(name = "pin_verified", nullable = false)
    private Boolean pinVerified = false;

    @Column(name = "last_pin_verified_at")
    private LocalDateTime lastPinVerifiedAt;

    @Column(name = "account_status", nullable = false, length = 20)
    private String accountStatus = "ACTIVE";

    /** Role used for authorization: USER | ADMIN | SUPER_ADMIN */
    @Column(name = "role", nullable = false, length = 20)
    private String role = "USER";

    /** Optional profile image URL for chat avatars */
    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPinHash() {
        return pinHash;
    }

    public void setPinHash(String pinHash) {
        this.pinHash = pinHash;
    }

    public Boolean getPinCreated() {
        return pinCreated;
    }

    public void setPinCreated(Boolean pinCreated) {
        this.pinCreated = pinCreated;
    }

    public Integer getPinFailedAttempts() {
        return pinFailedAttempts;
    }

    public void setPinFailedAttempts(Integer pinFailedAttempts) {
        this.pinFailedAttempts = pinFailedAttempts;
    }

    public LocalDateTime getPinLockExpiresAt() {
        return pinLockExpiresAt;
    }

    public void setPinLockExpiresAt(LocalDateTime pinLockExpiresAt) {
        this.pinLockExpiresAt = pinLockExpiresAt;
    }

    public Boolean getPinVerified() {
        return pinVerified;
    }

    public void setPinVerified(Boolean pinVerified) {
        this.pinVerified = pinVerified;
    }

    public LocalDateTime getLastPinVerifiedAt() {
        return lastPinVerifiedAt;
    }

    public void setLastPinVerifiedAt(LocalDateTime lastPinVerifiedAt) {
        this.lastPinVerifiedAt = lastPinVerifiedAt;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
}
