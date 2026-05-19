package com.rojorabelisoa.finance.shared.fmp;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class FmpClient {

    private static final String BASE = "https://financialmodelingprep.com/stable";

    private final HttpClient http;
    private final ObjectMapper mapper;

    @Value("${fmp.api.key:}")
    private String apiKey;

    public FmpClient(ObjectMapper mapper) {
        this.mapper = mapper;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /** Returns the first element of a JSON array response, or null. */
    public Map<?, ?> getFirst(String path) {
        List<?> list = getList(path);
        if (list == null || list.isEmpty()) return null;
        return list.get(0) instanceof Map<?, ?> m ? m : null;
    }

    /** Returns a JSON array response, or null on error. */
    public List<?> getList(String path) {
        try {
            String sep = path.contains("?") ? "&" : "?";
            String body = fetch(BASE + path + sep + "apikey=" + apiKey);
            Object parsed = mapper.readValue(body, Object.class);
            if (parsed instanceof List<?> l) return l;
            // Some endpoints return a single object
            if (parsed instanceof Map<?, ?> m) return List.of(m);
            return null;
        } catch (Exception e) {
            log.warn("FMP request failed for {}: {}", path, e.getMessage());
            return null;
        }
    }

    /** Raw string for diagnostics. */
    public String rawGet(String path) {
        try {
            String sep = path.contains("?") ? "&" : "?";
            return fetch(BASE + path + sep + "apikey=" + apiKey);
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    private String fetch(String url) throws Exception {
        var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();

        // 402 = premium endpoint, not available on free tier — treat as empty
        if (status == 402 || status == 404) return "[]";
        if (status != 200) {
            throw new RuntimeException("HTTP " + status + " — " + response.body().substring(0, Math.min(150, response.body().length())));
        }
        return response.body();
    }
}
