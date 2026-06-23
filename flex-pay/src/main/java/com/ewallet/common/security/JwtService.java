package com.ewallet.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateToken(String subject) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getExpirationMs());

        return Jwts.builder()
            .subject(subject)
            .issuer(jwtProperties.getIssuer())
            .issuedAt(now)
            .expiration(expiration)
            .signWith(getSigningKey())
            .compact();
    }

    public String extractSubject(String token) {
        try {
            return extractAllClaims(token).getSubject();
        } catch (RuntimeException exception) {
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public long getExpirationMs() {
        return jwtProperties.getExpirationMs();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        if (!StringUtils.hasText(jwtProperties.getSecret()) || jwtProperties.getSecret().length() < 32) {
            throw new IllegalStateException("security.jwt.secret must be at least 32 characters");
        }
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
