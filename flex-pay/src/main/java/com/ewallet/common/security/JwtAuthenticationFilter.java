package com.ewallet.common.security;

import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT authentication filter.
 * Reads the JWT from the Authorization header, validates it, and sets
 * the Spring Security context with the user''s role as a GrantedAuthority.
 *
 * Role values stored in DB: USER, ADMIN, SUPER_ADMIN.
 * Spring Security authority format: ROLE_USER, ROLE_ADMIN, ROLE_SUPER_ADMIN.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX        = "Bearer ";

    private final JwtService     jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService     = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(AUTHORIZATION_HEADER);

        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());

        if (!StringUtils.hasText(token) || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String phone = jwtService.extractSubject(token);

        if (phone != null && jwtService.isTokenValid(token)) {
            User user = userRepository.findByPhoneNumber(phone).orElse(null);

            if (user != null) {
                // Build authority from the user''s DB role, e.g. "ADMIN" -> "ROLE_ADMIN"
                String role = (user.getRole() != null) ? user.getRole() : "USER";
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, List.of(authority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
