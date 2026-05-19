package com.rojorabelisoa.finance.portfolio;

import com.rojorabelisoa.finance.portfolio.dto.PositionRequest;
import com.rojorabelisoa.finance.portfolio.dto.PositionResponse;
import com.rojorabelisoa.finance.shared.exception.AppException;
import com.rojorabelisoa.finance.user.User;
import com.rojorabelisoa.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;
    private final UserRepository userRepository;

    public List<PositionResponse> getPositions(String username) {
        User user = loadUser(username);
        return positionRepository.findByUser(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public PositionResponse addPosition(String username, PositionRequest request) {
        User user = loadUser(username);

        LocalDate buyDate = null;
        if (request.buyDate() != null && !request.buyDate().isBlank()) {
            try {
                buyDate = LocalDate.parse(request.buyDate());
            } catch (DateTimeParseException e) {
                throw new AppException("Invalid buyDate format, expected YYYY-MM-DD", 400);
            }
        }

        Position position = Position.builder()
                .user(user)
                .ticker(request.ticker())
                .name(request.name())
                .type(request.type())
                .market(request.market())
                .sector(request.sector())
                .shares(request.shares())
                .avgPrice(request.avgPrice())
                .currency(request.currency())
                .buyDate(buyDate)
                .notes(request.notes())
                .build();

        return toResponse(positionRepository.save(position));
    }

    public void deletePosition(String username, Long id) {
        User user = loadUser(username);
        Position position = positionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AppException("Position not found", 404));
        positionRepository.delete(position);
    }

    private PositionResponse toResponse(Position position) {
        return new PositionResponse(
                position.getId(),
                position.getTicker(),
                position.getName(),
                position.getType(),
                position.getMarket(),
                position.getSector(),
                position.getShares(),
                position.getAvgPrice(),
                position.getCurrency(),
                position.getBuyDate() != null ? position.getBuyDate().toString() : null,
                position.getNotes(),
                position.getCreatedAt() != null ? position.getCreatedAt().toString() : null
        );
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
