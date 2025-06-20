package com.bullionx.auth.controller;

import com.bullionx.auth.api.UserResponse;
import com.bullionx.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** GET /api/users/me */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        return ResponseEntity.ok(userService.getCurrentUser(auth));
    }
}
