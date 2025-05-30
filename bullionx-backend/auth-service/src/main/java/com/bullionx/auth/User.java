package com.bullionx.auth;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
  @Id
  @Column(length = 255, nullable = false, unique = true)
  @Email @NotBlank
  private String email;

  @Column(name = "first_name", length = 100, nullable = false)
  @NotBlank @Size(max = 100)
  private String firstName;

  @Column(name = "last_name", length = 100, nullable = false)
  @NotBlank @Size(max = 100)
  private String lastName;

  @Column(name = "password_hash", nullable = false)
  @NotBlank
  private String passwordHash;

  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  // ← Add getters & setters (or use Lombok @Data)
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }
  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public boolean isEmailVerified() { return emailVerified; }
  public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
