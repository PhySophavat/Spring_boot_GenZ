package com.ewallet.user.repository;

import com.ewallet.user.entity.UserPublicToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPublicTokenRepository extends JpaRepository<UserPublicToken, Long> {
    Optional<UserPublicToken> findByPublicTokenAndActiveTrue(String token);
    Optional<UserPublicToken> findByUserIdAndActiveTrue(Long userId);
    Optional<UserPublicToken> findByUserId(Long userId);
}
