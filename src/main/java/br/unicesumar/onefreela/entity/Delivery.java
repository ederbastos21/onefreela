package br.unicesumar.onefreela.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Delivery {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    Long id;

    String fileUrl;
    String message;
}
