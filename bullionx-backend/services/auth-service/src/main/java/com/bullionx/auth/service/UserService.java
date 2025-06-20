package com.bullionx.auth.service;

import com.bullionx.auth.api.UserResponse;
import com.bullionx.auth.user.User;
import com.bullionx.auth.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor            // Lombok generates the constructor for 'repo'
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repo;

    /** Returns the currently-authenticated user as a DTO. */
    public UserResponse getCurrentUser(Authentication auth) {
        Long userId = Long.valueOf(auth.getName());       // subject == id
        User user = repo.findById(userId)
                .orElseThrow(() ->
                        new IllegalStateException("User not found: " + userId));

        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }
}
