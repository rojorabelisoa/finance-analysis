package com.rojorabelisoa.finance.market;

import com.rojorabelisoa.finance.market.dto.FundamentalsDto;
import com.rojorabelisoa.finance.market.dto.QuoteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    @GetMapping("/quote/{ticker}")
    public ResponseEntity<QuoteDto> getQuote(@PathVariable String ticker) {
        return ResponseEntity.ok(marketService.getQuote(ticker));
    }

    @GetMapping("/fundamentals/{ticker}")
    public ResponseEntity<FundamentalsDto> getFundamentals(@PathVariable String ticker) {
        return ResponseEntity.ok(marketService.getFundamentals(ticker));
    }

    @GetMapping("/search")
    public ResponseEntity<String> search(@RequestParam String q) {
        String resolved = isIsin(q) ? marketService.resolveIsin(q) : q;
        return ResponseEntity.ok(resolved);
    }

    @GetMapping("/fx")
    public ResponseEntity<Double> getFxRate(@RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(marketService.getFxRate(from, to));
    }

    private boolean isIsin(String s) {
        return s.matches("[A-Z]{2}[A-Z0-9]{10}");
    }
}
