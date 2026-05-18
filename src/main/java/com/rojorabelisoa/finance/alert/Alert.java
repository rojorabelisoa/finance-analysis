package com.rojorabelisoa.finance.alert;

import com.rojorabelisoa.finance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private String alertType; // PE_THRESHOLD

    @Column(nullable = false)
    private Double threshold;

    private boolean active = true;

    private LocalDateTime triggeredAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
