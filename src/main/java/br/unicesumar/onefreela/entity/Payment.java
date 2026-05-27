package br.unicesumar.onefreela.entity;

import br.unicesumar.onefreela.enums.PaymentMethod;
import br.unicesumar.onefreela.enums.PaymentStatus;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    Order order;

    Double value;

    PaymentStatus status;
    PaymentMethod paymentMethod;
    LocalDate paidAt;
    LocalDate releasedAt;
    Double platformFee;
    Double freelancerValue;
}
