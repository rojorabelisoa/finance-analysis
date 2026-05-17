package com.rojorabelisoa.finance.portfolio;

import com.rojorabelisoa.finance.portfolio.dto.PositionRequest;
import com.rojorabelisoa.finance.portfolio.dto.PositionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @GetMapping("/")
    public ResponseEntity<List<PositionResponse>> getPositions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(positionService.getPositions(username));
    }

    @PostMapping("/")
    public ResponseEntity<PositionResponse> addPosition(@RequestBody PositionRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(positionService.addPosition(username, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        positionService.deletePosition(username, id);
        return ResponseEntity.noContent().build();
    }
}
