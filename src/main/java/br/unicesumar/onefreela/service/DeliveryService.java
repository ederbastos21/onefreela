package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.entity.Delivery;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.repository.DeliveryRepository;
import org.aspectj.weaver.ast.Or;
import org.springframework.stereotype.Service;

@Service
public class DeliveryService {

    DeliveryRepository deliveryRepository;
    OrderItem orderItem;

    public DeliveryService(DeliveryRepository deliveryRepository, OrderItem orderItem){
        this.deliveryRepository = deliveryRepository;
        this.orderItem = orderItem;
    }

    public Delivery save (Delivery delivery){
        return deliveryRepository.save(delivery);
    }
}
