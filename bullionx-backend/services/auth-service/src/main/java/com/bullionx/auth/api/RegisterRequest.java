package com.bullionx.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty; 

public record RegisterRequest(

        @NotBlank
        String firstName,

        @NotBlank
        String lastName,

        @Email
        String email,

        @Size(min = 10, message = "Password must be at least 10 characters")
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        String password
) { }
