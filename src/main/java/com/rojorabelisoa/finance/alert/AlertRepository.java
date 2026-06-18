package com.rojorabelisoa.finance.alert;

import com.rojorabelisoa.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUser(User user);
    List<Alert> findByActiveTrue();
}
