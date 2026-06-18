package com.rojorabelisoa.finance.shared.yahoo;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Component
@Slf4j
public class YahooFinanceClient {

    private static final String UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private static final String Q1 = "https://query1.finance.yahoo.com";
    private static final String Q2 = "https://query2.finance.yahoo.com";

    private final HttpClient http;
    private final ObjectMapper mapper;
    private volatile String crumb;

    public YahooFinanceClient(ObjectMapper mapper) {
        this.mapper = mapper;
        this.http = HttpClient.newBuilder()
                .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @PostConstruct
    public void init() {
        try {
            refreshCrumb();
        } catch (Exception e) {
            log.warn("Yahoo crumb init failed: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelay = 3_600_000)
    public void refreshCrumb() {
        try {
            // Plant Yahoo cookie via the main finance page (sets A1/A3 cookie on .yahoo.com)
            try {
                rawFetch("https://finance.yahoo.com/");
            } catch (Exception ignored) {}

            // Small pause to avoid 429 during init
            Thread.sleep(500);

            String result = rawFetch(Q2 + "/v1/test/getcrumb");
            if (result != null && !result.isBlank() && !result.startsWith("<") && !result.startsWith("{")) {
                crumb = result.trim();
                log.info("Yahoo crumb OK");
            } else {
                log.warn("Yahoo crumb response unexpected: {}", result != null ? result.substring(0, Math.min(50, result.length())) : "null");
            }
        } catch (Exception e) {
            log.warn("Yahoo crumb refresh failed: {}", e.getMessage());
        }
    }

    /** Raw string fetch — no JSON parsing, no crumb, for diagnostics. */
    public String rawGet(String path) {
        try { return rawFetch(Q1 + path); } catch (Exception e1) {
            try { return rawFetch(Q2 + path); } catch (Exception e2) { return "ERROR: " + e2.getMessage(); }
        }
    }

    public String getCrumb() { return crumb; }

    /** Fetch a path. Tries query1 then query2, appends crumb automatically. */
    public Map<?, ?> get(String path) {
        String fullPath = crumb != null
                ? path + (path.contains("?") ? "&" : "?") + "crumb=" + crumb
                : path;

        // Try query1
        try {
            String body = rawFetch(Q1 + fullPath);
            if (body != null) return mapper.readValue(body, Map.class);
        } catch (RateLimitException e) {
            log.warn("Yahoo 429 on query1 for {}", path);
            waitAfterRateLimit();
        } catch (Exception ignored) {}

        // Fallback query2
        try {
            String body = rawFetch(Q2 + fullPath);
            if (body != null) return mapper.readValue(body, Map.class);
        } catch (RateLimitException e) {
            log.warn("Yahoo 429 on query2 for {}", path);
        } catch (Exception e) {
            log.warn("Yahoo request failed for {}: {}", path, e.getMessage());
        }
        return null;
    }

    private void waitAfterRateLimit() {
        try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
    }

    private String rawFetch(String url) throws Exception {
        var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", UA)
                .header("Accept", "application/json,text/html,*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Accept-Encoding", "gzip, deflate, br")
                .header("Referer", "https://finance.yahoo.com/")
                .header("Origin", "https://finance.yahoo.com")
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();

        if (status == 429) {
            if (crumb != null) crumb = null;
            throw new RateLimitException("HTTP 429");
        }
        if (status == 401 || status == 403) {
            crumb = null;
            try { refreshCrumb(); } catch (Exception ignored) {}
            throw new RuntimeException("HTTP " + status + " — crumb reset");
        }
        if (status != 200) {
            throw new RuntimeException("HTTP " + status);
        }
        return response.body();
    }

    static class RateLimitException extends RuntimeException {
        RateLimitException(String msg) { super(msg); }
    }
}
