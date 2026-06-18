package com.rojorabelisoa.finance.alert;

import com.rojorabelisoa.finance.alert.dto.AlertRequest;
import com.rojorabelisoa.finance.alert.dto.AlertResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(alertService.getAlerts(username));
    }

    @PostMapping
    public ResponseEntity<AlertResponse> createAlert(@RequestBody AlertRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.createAlert(username, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        alertService.deleteAlert(username, id);
        return ResponseEntity.noContent().build();
    }
}
