package br.unicesumar.onefreela.entity;

import jakarta.persistence.*;

@Entity
public class Delivery {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    Long id;

    String fileUrl;
    String message;

    @ManyToOne
    OrderItem orderItem;
}
