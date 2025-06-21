package com.bullionx.auth.controller;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.Duration;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
@EnableCaching
public class QuotesProxyController {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Simple in-memory cache with TTL
    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();
    private final Duration cacheTTL = Duration.ofMinutes(1); // Cache for 1 minute

    // Rate limiting
    private LocalDateTime lastRequestTime = LocalDateTime.MIN;
    private final Duration minRequestInterval = Duration.ofSeconds(10);

    public QuotesProxyController() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping(value = "/quotes", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getQuotes(@RequestParam String symbols) {
        try {
            // Check cache first
            String cacheKey = symbols;
            CachedQuote cached = cache.get(cacheKey);

            if (cached != null && cached.isValid()) {
                System.out.println("Returning cached data for: " + symbols);
                return ResponseEntity.ok()
                        .header("X-Cache", "HIT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(cached.data);
            }

            // Rate limiting check
            LocalDateTime now = LocalDateTime.now();
            Duration timeSinceLastRequest = Duration.between(lastRequestTime, now);

            if (timeSinceLastRequest.compareTo(minRequestInterval) < 0) {
                // Return cached data even if expired, or error
                if (cached != null) {
                    System.out.println("Rate limited - returning stale cache");
                    return ResponseEntity.ok()
                            .header("X-Cache", "STALE")
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(cached.data);
                }

                Map<String, Object> error = new HashMap<>();
                error.put("error", "Rate limited");
                error.put("retryAfter", minRequestInterval.minus(timeSinceLastRequest).getSeconds());
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(error);
            }

            lastRequestTime = now;

            // Build Yahoo Finance URL
            String yahooUrl = UriComponentsBuilder
                    .fromHttpUrl("https://query1.finance.yahoo.com/v7/finance/quote")
                    .queryParam("symbols", symbols)
                    .queryParam("fields", "symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent")
                    .toUriString();

            System.out.println("Fetching from Yahoo: " + symbols);

            // Make request to Yahoo Finance
            ResponseEntity<String> yahooResponse = restTemplate.getForEntity(yahooUrl, String.class);

            if (yahooResponse.getStatusCode() == HttpStatus.OK && yahooResponse.getBody() != null) {
                Map<String, Object> yahooData = objectMapper.readValue(yahooResponse.getBody(), Map.class);

                // Cache the response
                cache.put(cacheKey, new CachedQuote(yahooData));

                return ResponseEntity.ok()
                        .header("X-Cache", "MISS")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(yahooData);
            } else {
                throw new RuntimeException("Invalid response from Yahoo Finance");
            }

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                System.err.println("Yahoo Finance rate limit hit");

                // Try to return cached data
                CachedQuote cached = cache.get(symbols);
                if (cached != null) {
                    return ResponseEntity.ok()
                            .header("X-Cache", "STALE")
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(cached.data);
                }
            }

            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getStatusCode().toString());
            error.put("message", e.getMessage());

            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);

        } catch (Exception e) {
            System.err.println("Error fetching quotes: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    // Cache entry with TTL
    private static class CachedQuote {
        final Map<String, Object> data;
        final LocalDateTime timestamp;
        final Duration ttl = Duration.ofMinutes(1);

        CachedQuote(Map<String, Object> data) {
            this.data = data;
            this.timestamp = LocalDateTime.now();
        }

        boolean isValid() {
            return Duration.between(timestamp, LocalDateTime.now()).compareTo(ttl) < 0;
        }
    }

    // Mock data endpoint for testing
    @GetMapping("/quotes/mock")
    public ResponseEntity<?> getMockQuotes(@RequestParam String symbols) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> quoteResponse = new HashMap<>();
        List<Map<String, Object>> result = new ArrayList<>();

        for (String symbol : symbols.split(",")) {
            Map<String, Object> quote = new HashMap<>();
            quote.put("symbol", symbol.trim());
            quote.put("regularMarketPrice", 100 + Math.random() * 400);
            quote.put("regularMarketChange", -5 + Math.random() * 10);
            quote.put("regularMarketChangePercent", -2 + Math.random() * 4);
            result.add(quote);
        }

        quoteResponse.put("result", result);
        response.put("quoteResponse", quoteResponse);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}