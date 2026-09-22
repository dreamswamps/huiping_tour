package org.huiping.server.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Pattern BEARER = Pattern.compile("^Bearer\\s+(\\S+)$", Pattern.CASE_INSENSITIVE);

    private final SecretKey secretKey;

    public JwtAuthFilter(@Value("${app.jwt.secret:hpt-dev-jwt-secret-change-me}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(java.util.Arrays.copyOf(bytes, Math.max(32, bytes.length)));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, java.io.IOException {
        String header = request.getHeader("Authorization");
        if (header != null) {
            Matcher matcher = BEARER.matcher(header);
            if (matcher.matches()) {
                try {
                    Claims claims = Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims(matcher.group(1)).getPayload();
                    Object userId = claims.get("userId");
                    Object openid = claims.get("openid");
                    if (userId != null && openid != null) {
                        request.setAttribute("userId", Long.valueOf(String.valueOf(userId)));
                        request.setAttribute("openid", String.valueOf(openid));
                    }
                } catch (JwtException | IllegalArgumentException ignored) {
                    // Protected endpoints produce the same 401 contract as the Node middleware.
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
