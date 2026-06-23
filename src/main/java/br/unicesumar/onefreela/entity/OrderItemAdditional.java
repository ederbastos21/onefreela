package br.unicesumar.onefreela.entity;

import jakarta.persistence.*;

@Entity
public class OrderItemAdditional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private OrderItem orderItem;

    @ManyToOne
    private WorkAdditional workAdditional;

    private double price;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public WorkAdditional getWorkAdditional() {
        return workAdditional;
    }

    public void setWorkAdditional(WorkAdditional workAdditional) {
        this.workAdditional = workAdditional;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }
}
