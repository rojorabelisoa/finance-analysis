package com.rojorabelisoa.finance.portfolio;

import com.rojorabelisoa.finance.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "positions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private String name;

    private String type;

    private String market;

    private String sector;

    @Column(nullable = false)
    private Double shares;

    @Column(nullable = false)
    private Double avgPrice;

    @Column(nullable = false)
    private String currency;

    private LocalDate buyDate;

    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
