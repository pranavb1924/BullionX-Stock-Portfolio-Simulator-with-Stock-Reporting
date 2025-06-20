package com.bullionx.auth.controller;

import com.bullionx.auth.api.RegisterRequest;
import com.bullionx.auth.api.UserResponse;
import com.bullionx.auth.service.AuthService;
import com.bullionx.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bullionx.auth.api.LoginRequest;
import com.bullionx.auth.api.AuthResponse;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    /** Sign-up endpoint */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);  
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        return ResponseEntity.ok(userService.getCurrentUser(auth));
    }
}
