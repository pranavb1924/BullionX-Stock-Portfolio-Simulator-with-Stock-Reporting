package com.bullionx.auth;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for User entities.
 * The String type parameter is the type of the User’s primary key (email).
 */
public interface UserRepository extends JpaRepository<User, String> {
  /** Check if a user with the given email already exists */
  boolean existsByEmail(String email);
}
