package com.bullionx.auth.api;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email
) { }
