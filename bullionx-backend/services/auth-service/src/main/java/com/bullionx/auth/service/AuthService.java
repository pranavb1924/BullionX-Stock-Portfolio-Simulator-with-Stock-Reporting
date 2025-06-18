package com.bullionx.auth.service;

import com.bullionx.auth.api.AuthResponse;
import com.bullionx.auth.api.LoginRequest;
import com.bullionx.auth.api.RegisterRequest;
import com.bullionx.auth.api.UserResponse;
import com.bullionx.auth.config.JwtUtil;
import com.bullionx.auth.user.User;
import com.bullionx.auth.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor             // Lombok generates a constructor for final fields
public class AuthService {

    private final UserRepository repo;
    private final JwtUtil jwtUtil;

    // Local encoder instance (alternatively, declare it as a @Bean)
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /** Sign-up logic */
    public UserResponse register(RegisterRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User saved = repo.save(User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .password(encoder.encode(req.password()))
                .build());

        return new UserResponse(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail()
        );
    }

    /** Login: verify creds → return JWT + user info */
    public AuthResponse login(LoginRequest req) {
        User user = repo.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!encoder.matches(req.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId());

        UserResponse resp = new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );

        return new AuthResponse(token, resp);
    }
}
