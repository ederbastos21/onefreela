package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.entity.Delivery;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import br.unicesumar.onefreela.repository.DeliveryRepository;
import org.aspectj.weaver.ast.Or;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {

    DeliveryRepository deliveryRepository;

    public DeliveryService(DeliveryRepository deliveryRepository){
        this.deliveryRepository = deliveryRepository;
    }

    public Delivery save (Delivery delivery){
        return deliveryRepository.save(delivery);
    }

    public List<OrderItem> findPendingDeliveries(User user){
        return deliveryRepository.findByFreelancerAndStatus(user, OrderItemStatus.PENDING_DELIVERY);
    }

    public List<OrderItem> findOnDispute(User user){
        return deliveryRepository.findByFreelancerAndStatus(user, OrderItemStatus.ON_DISPUTE);
    }

    public List<OrderItem> findPendingAdjustments(User user){
        return deliveryRepository.findByFreelancerAndStatus(user, OrderItemStatus.ADJUSTMENT_REQUEST);
    }

    public List<OrderItem> findCompleted(User user){
        return deliveryRepository.findByFreelancerAndStatus(user, OrderItemStatus.COMPLETED);
    }
}
