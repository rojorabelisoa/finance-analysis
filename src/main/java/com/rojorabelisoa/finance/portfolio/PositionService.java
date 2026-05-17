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
                .buyDate(request.buyDate() != null ? LocalDate.parse(request.buyDate()) : null)
                .notes(request.notes())
                .build();

        return toResponse(positionRepository.save(position));
    }

    public void deletePosition(String username, Long id) {
        User user = loadUser(username);

        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new AppException("Position not found", 404));

        if (!position.getUser().getId().equals(user.getId())) {
            throw new AppException("Access denied", 403);
        }

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
