package com.rojorabelisoa.finance.alert;

import com.rojorabelisoa.finance.alert.dto.AlertRequest;
import com.rojorabelisoa.finance.alert.dto.AlertResponse;
import com.rojorabelisoa.finance.screener.ScreenerService;
import com.rojorabelisoa.finance.screener.dto.ScreenerResultDto;
import com.rojorabelisoa.finance.shared.EmailService;
import com.rojorabelisoa.finance.shared.exception.AppException;
import com.rojorabelisoa.finance.user.User;
import com.rojorabelisoa.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final ScreenerService screenerService;
    private final EmailService emailService;

    public List<AlertResponse> getAlerts(String username) {
        User user = loadUser(username);
        return alertRepository.findByUser(user).stream().map(this::toResponse).toList();
    }

    public AlertResponse createAlert(String username, AlertRequest request) {
        User user = loadUser(username);
        Alert alert = Alert.builder()
                .user(user)
                .ticker(request.ticker().toUpperCase())
                .alertType(request.alertType())
                .threshold(request.threshold())
                .active(true)
                .build();
        return toResponse(alertRepository.save(alert));
    }

    public void deleteAlert(String username, Long id) {
        User user = loadUser(username);
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new AppException("Alert not found", 404));
        if (!alert.getUser().getId().equals(user.getId())) {
            throw new AppException("Access denied", 403);
        }
        alertRepository.delete(alert);
    }

    @Scheduled(fixedDelay = 3600000)
    public void checkAlerts() {
        List<Alert> alerts = alertRepository.findByActiveTrue();
        for (Alert alert : alerts) {
            try {
                ScreenerResultDto quote = screenerService.getQuoteForAlert(alert.getTicker());
                if (quote == null || quote.peRatio() == null) continue;

                boolean triggered = false;
                String message = "";

                if ("PE_THRESHOLD".equals(alert.getAlertType()) && quote.peRatio() <= alert.getThreshold()) {
                    triggered = true;
                    message = String.format(
                            "Alerte déclenchée : %s (%s)\nP/E actuel : %.2f — en dessous de votre seuil de %.2f",
                            alert.getTicker(), quote.name() != null ? quote.name() : alert.getTicker(),
                            quote.peRatio(), alert.getThreshold()
                    );
                }

                if (triggered) {
                    alert.setTriggeredAt(LocalDateTime.now());
                    alert.setActive(false);
                    alertRepository.save(alert);

                    String email = alert.getUser().getEmail();
                    emailService.send(email,
                            "Finance Dashboard — Alerte " + alert.getTicker(),
                            message);
                }
            } catch (Exception e) {
                // ne pas stopper le batch si un ticker échoue
            }
        }
    }

    private AlertResponse toResponse(Alert a) {
        return new AlertResponse(
                a.getId(),
                a.getTicker(),
                a.getAlertType(),
                a.getThreshold(),
                a.isActive(),
                a.getTriggeredAt() != null ? a.getTriggeredAt().toString() : null,
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null
        );
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
