package com.rojorabelisoa.finance.portfolio;

import com.rojorabelisoa.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {

    List<Position> findByUser(User user);

    Optional<Position> findByIdAndUser(Long id, User user);
}
