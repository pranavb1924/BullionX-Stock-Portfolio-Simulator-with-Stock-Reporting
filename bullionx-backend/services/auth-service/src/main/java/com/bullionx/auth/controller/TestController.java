// src/main/java/com/bullionx/auth/controller/TestController.java
package com.bullionx.auth.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/protected")
    public String ping(Authentication auth) {
        return "OK – userId=" + auth.getPrincipal();
    }
}
