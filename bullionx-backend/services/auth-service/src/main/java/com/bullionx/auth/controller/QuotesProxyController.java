package com.bullionx.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
@EnableCaching
public class QuotesProxyController {

    private final RestTemplate rest = new RestTemplate();

    // simple TTL cache
    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();
    private final Duration cacheTTL = Duration.ofMinutes(1);

    // rate-limit: one upstream call every 10s
    private Instant lastCall = Instant.EPOCH;
    private final Duration minInterval = Duration.ofSeconds(10);

    @Value("${finnhub.api.key}")
    private String apiKey;

    @GetMapping(value = "/quotes", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getQuotes(@RequestParam String symbols) {
        Instant now = Instant.now();
        Duration since = Duration.between(lastCall, now);

        // build result container
        Map<String, Object> result = new LinkedHashMap<>();
        for (String sym : symbols.split(",")) {
            String key = sym.trim().toUpperCase();
            CachedQuote cq = cache.get(key);

            // serve cache if fresh or rate-limited
            if (cq != null && cq.isFresh(cacheTTL)) {
                result.put(key, cq.data);
                continue;
            }
            if (since.compareTo(minInterval) < 0 && cq != null) {
                result.put(key, cq.data);
                continue;
            }

            // otherwise fetch from Finnhub
            try {
                String url = UriComponentsBuilder
                        .fromHttpUrl("https://finnhub.io/api/v1/quote")
                        .queryParam("symbol", key)
                        .queryParam("token", apiKey)
                        .toUriString();

                @SuppressWarnings("unchecked")
                Map<String, Object> body = rest.getForObject(url, Map.class);
                // body contains keys "c", "d", "dp", "h", "l", "o", "pc", "t"
                // we'll only keep c,d,dp
                Map<String, Object> quote = Map.of(
                        "price",        body.get("c"),
                        "change",       body.get("d"),
                        "changePct",    body.get("dp")
                );
                cache.put(key, new CachedQuote(quote));
                result.put(key, quote);

                lastCall = Instant.now();  // reset rate timer
            } catch (HttpClientErrorException.TooManyRequests ex) {
                // upstream rate-limit hit — fallback to stale or error
                if (cq != null) {
                    result.put(key, cq.data);
                } else {
                    result.put(key, Map.of("error", "rate_limited"));
                }
            } catch (Exception ex) {
                result.put(key, Map.of("error", ex.getMessage()));
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("quotes", result));
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> searchSymbols(@RequestParam String q) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://finnhub.io/api/v1/search")
                .queryParam("q", q)
                .queryParam("token", apiKey)
                .toUriString();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> raw = rest.getForObject(url, Map.class);
            // Finnhub returns { "count": 6, "result": [ { "symbol": "...", "description": "...", ... }, … ] }
            // We’ll passthrough only the two fields Angular needs.
            List<Map<String, String>> slim = ((List<Map<String, Object>>) raw.get("result"))
                    .stream()
                    .map(m -> Map.of(
                            "symbol",      (String) m.get("symbol"),
                            "description", (String) m.get("description")
                    ))
                    .toList();

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(slim);

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    private static class CachedQuote {
        final Map<String, Object> data;
        final Instant time;
        CachedQuote(Map<String, Object> d) { this.data = d; this.time = Instant.now(); }
        boolean isFresh(Duration ttl) { return Duration.between(time, Instant.now()).compareTo(ttl) < 0; }
    }
}