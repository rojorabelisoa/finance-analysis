package com.rojorabelisoa.finance.screener;

import com.rojorabelisoa.finance.screener.dto.ScreenerResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/screener")
@RequiredArgsConstructor
public class ScreenerController {

    private final ScreenerService screenerService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> screen(
            @RequestParam(required = false) Double peMax,
            @RequestParam(required = false) Double revenueGrowthMin,
            @RequestParam(required = false) Double epsGrowthMin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<ScreenerResultDto> content = screenerService.screen(peMax, revenueGrowthMin, epsGrowthMin, page, size);
        long total = screenerService.countScreened(peMax, revenueGrowthMin, epsGrowthMin);

        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", total,
                "totalPages", (int) Math.ceil((double) total / size),
                "page", page
        ));
    }
}
