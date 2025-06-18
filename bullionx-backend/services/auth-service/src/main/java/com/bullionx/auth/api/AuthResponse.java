package com.bullionx.auth.api;

/** Response returned after successful login. */
public record AuthResponse(
    String token,
    UserResponse user
) { }
