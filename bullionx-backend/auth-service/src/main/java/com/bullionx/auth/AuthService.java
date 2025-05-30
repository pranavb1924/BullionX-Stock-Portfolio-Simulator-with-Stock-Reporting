package com.bullionx.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository userRepo;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository userRepo) {
    this.userRepo = userRepo;
  }

  /**
   * Registers a new user.
   * @throws IllegalArgumentException if the email is already in use.
   */
  @Transactional
  public User register(RegisterRequest req) {
    if (userRepo.existsByEmail(req.getEmail())) {
      throw new IllegalArgumentException("Email already in use");
    }

    User user = new User();
    user.setEmail(req.getEmail());
    user.setFirstName(req.getFirstName());
    user.setLastName(req.getLastName());
    // hash the raw password
    String hashed = passwordEncoder.encode(req.getPassword());
    user.setPasswordHash(hashed);

    return userRepo.save(user);
  }
}
