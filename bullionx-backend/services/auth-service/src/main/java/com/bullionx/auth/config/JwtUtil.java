package com.bullionx.auth.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

import static io.jsonwebtoken.Jwts.*;

@Component
public class JwtUtil {

    // Load from application.properties (we’ll add this next)
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    /** Generate a signed JWT containing the user’s ID in the subject. */
    public String generateToken(Long userId) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        long now = System.currentTimeMillis();
        return builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Validate the token and return the user ID if valid, or throw on failure. */
    public Long validateAndGetUserId(String token) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        Jws<Claims> claims = Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
        return Long.parseLong(claims.getBody().getSubject());
    }
}
