package com.bullionx.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Hashing algo used everywhere */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Minimal chain: allow auth endpoints, lock everything else (for now) */
    @Bean
    SecurityFilterChain defaultChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())                // not needed for pure JSON API
                .sessionManagement(sm -> sm.disable())       // stateless
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults());        // temporary fallback; will replace with JWT filter
        return http.build();
    }
}
