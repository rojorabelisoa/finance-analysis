package com.rojorabelisoa.finance.settings;

import com.rojorabelisoa.finance.portfolio.Position;
import com.rojorabelisoa.finance.portfolio.PositionRepository;
import com.rojorabelisoa.finance.portfolio.dto.PortfolioHistoryDto;
import com.rojorabelisoa.finance.portfolio.dto.SnapshotDto;
import com.rojorabelisoa.finance.settings.dto.PeaInfoDto;
import com.rojorabelisoa.finance.settings.dto.UserSettingsDto;
import com.rojorabelisoa.finance.user.User;
import com.rojorabelisoa.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;

    public UserSettings getSettings(Long userId) {
        return userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.debug("No settings found for userId={}, creating empty settings", userId);
                    UserSettings empty = UserSettings.builder()
                            .userId(userId)
                            .build();
                    return userSettingsRepository.save(empty);
                });
    }

    public UserSettings updateSettings(Long userId, UserSettingsDto dto) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> UserSettings.builder().userId(userId).build());

        settings.setPeaOpeningDate(dto.peaOpeningDate());
        settings.setAllocationTargetsJson(dto.allocationTargetsJson());

        return userSettingsRepository.save(settings);
    }

    public PortfolioHistoryDto getPortfolioHistory(String username) {
        User user = loadUser(username);
        List<Position> positions = positionRepository.findByUser(user);

        LocalDate today = LocalDate.now();

        // Sort by buyDate ascending, null dates treated as today
        List<Position> sorted = positions.stream()
                .sorted(Comparator.comparing(
                        p -> p.getBuyDate() != null ? p.getBuyDate() : today))
                .toList();

        double cumulative = 0;
        List<SnapshotDto> snapshots = new ArrayList<>();

        for (Position position : sorted) {
            LocalDate date = position.getBuyDate() != null ? position.getBuyDate() : today;
            cumulative += position.getShares() * position.getAvgPrice();
            snapshots.add(new SnapshotDto(date, cumulative));
        }

        double totalInvested = positions.stream()
                .mapToDouble(p -> p.getShares() * p.getAvgPrice())
                .sum();

        return new PortfolioHistoryDto(snapshots, totalInvested, null);
    }

    public PeaInfoDto getPeaInfo(String username) {
        User user = loadUser(username);
        UserSettings settings = getSettings(user.getId());
        LocalDate openingDate = settings.getPeaOpeningDate();

        // Compute total invested for max contribution remaining
        List<Position> positions = positionRepository.findByUser(user);
        long totalInvested = Math.round(positions.stream()
                .mapToDouble(p -> p.getShares() * p.getAvgPrice())
                .sum());
        long maxContributionRemaining = 150_000L - totalInvested;

        if (openingDate == null) {
            return new PeaInfoDto(null, null, null, null, null, null, null, null, maxContributionRemaining);
        }

        LocalDate today = LocalDate.now();
        long daysOpen = ChronoUnit.DAYS.between(openingDate, today);
        double yearsOpen = daysOpen / 365.25;

        LocalDate fiveYearDate = openingDate.plusYears(5);
        long daysToFiveYears = ChronoUnit.DAYS.between(today, fiveYearDate);
        boolean hasReachedFiveYears = !today.isBefore(fiveYearDate);

        double currentTaxRate = hasReachedFiveYears ? 17.2 : 30.0;
        double socialChargesRate = 17.2;

        return new PeaInfoDto(
                openingDate,
                daysOpen,
                yearsOpen,
                fiveYearDate,
                daysToFiveYears,
                hasReachedFiveYears,
                currentTaxRate,
                socialChargesRate,
                maxContributionRemaining
        );
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
