package com.bullionx.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for user registration.
 */
public class RegisterRequest {
  @NotBlank @Size(max = 100)
  private String firstName;

  @NotBlank @Size(max = 100)
  private String lastName;

  @Email @NotBlank @Size(max = 255)
  private String email;

  @NotBlank @Size(min = 8)
  private String password;

  // Getters and setters
  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }

  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
}
