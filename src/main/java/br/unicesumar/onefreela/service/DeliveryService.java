package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.entity.Delivery;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import br.unicesumar.onefreela.repository.DeliveryRepository;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import org.aspectj.weaver.ast.Or;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderItemRepository orderItemRepository;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OrderItemRepository orderItemRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public Delivery save (Delivery delivery){
        return deliveryRepository.save(delivery);
    }

    public List<OrderItem> findPendingDeliveries(User user){
        return orderItemRepository.findByWorkOwnerAndStatus(user, OrderItemStatus.PENDING_DELIVERY);
    }

    public List<OrderItem> findOnDispute(User user){
        return orderItemRepository.findByWorkOwnerAndStatus(user, OrderItemStatus.ON_DISPUTE);
    }

    public List<OrderItem> findPendingAdjustments(User user){
        return orderItemRepository.findByWorkOwnerAndStatus(user, OrderItemStatus.ADJUSTMENT_REQUEST);
    }

    public List<OrderItem> findCompleted(User user){
        return orderItemRepository.findByWorkOwnerAndStatus(user, OrderItemStatus.COMPLETED);
    }
}
