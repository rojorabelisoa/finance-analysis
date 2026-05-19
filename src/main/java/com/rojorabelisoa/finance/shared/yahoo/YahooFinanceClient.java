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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Component
@Slf4j
public class YahooFinanceClient {

    private static final String UA =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
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
                .connectTimeout(Duration.ofSeconds(10))
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
            // First call plants the cookie
            rawFetch(Q2 + "/v1/test/getcrumb");
            String result = rawFetch(Q2 + "/v1/test/getcrumb");
            if (result != null && !result.isBlank() && !result.startsWith("<") && !result.startsWith("{")) {
                crumb = result.trim();
                log.debug("Yahoo crumb refreshed");
            }
        } catch (Exception e) {
            log.warn("Yahoo crumb refresh failed: {}", e.getMessage());
        }
    }

    /** Raw string fetch for diagnostics (no JSON parsing, no crumb). */
    public String rawGet(String path) {
        try { return rawFetch(Q1 + path); } catch (Exception ignored) {}
        try { return rawFetch(Q2 + path); } catch (Exception e) { return "ERROR: " + e.getMessage(); }
    }

    public String getCrumb() { return crumb; }

    /**
     * Fetch a Yahoo Finance path (starting with /). Tries query1 first, then query2.
     * Appends crumb automatically if available.
     */
    public Map<?, ?> get(String path) {
        String fullPath = crumb != null
                ? path + (path.contains("?") ? "&" : "?") + "crumb=" + crumb
                : path;

        try {
            String body = rawFetch(Q1 + fullPath);
            if (body != null) return mapper.readValue(body, Map.class);
        } catch (Exception ignored) {}

        try {
            String body = rawFetch(Q2 + fullPath);
            if (body != null) return mapper.readValue(body, Map.class);
        } catch (Exception e) {
            log.warn("Yahoo request failed for {}: {}", path, e.getMessage());
        }
        return null;
    }

    private String rawFetch(String url) throws Exception {
        var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", UA)
                .header("Accept", "application/json,text/plain,*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Referer", "https://finance.yahoo.com")
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();

        if (status == 401 || status == 403) {
            crumb = null;
            try { refreshCrumb(); } catch (Exception ignored) {}
            throw new RuntimeException("HTTP " + status + " — crumb cleared");
        }
        if (status != 200) {
            throw new RuntimeException("HTTP " + status);
        }
        return response.body();
    }
}
