package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.MakeOrderDTO;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.OrderStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import br.unicesumar.onefreela.repository.OrderRepository;
import org.aspectj.weaver.ast.Or;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;

    public OrderService (OrderItemRepository orderItemRepository, OrderRepository orderRepository){
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public Order findById(Long id){
        return orderRepository.findById(id).orElseThrow();
    }

    public Order saveOrder (Order order){
        return orderRepository.save(order);
    }

    public List<Order> findAllOrders (){
        return orderRepository.findAll();
    }


    public Order makeOrder (User user, MakeOrderDTO makeOrderDTO){
        Cart cart = user.getCart();
        List<ErrorDetail> errors = new ArrayList<>();

        List<CartItem> cartItemList = cart.getCartItemList();

        if (cartItemList.isEmpty()){
            errors.add(new ErrorDetail(ErrorCode.CART_EMPTY, "order", "o carrinho nao possui nenhum item"));
            throw new ValidationException(errors);
        }

        Order order = new Order();
        List <OrderItem> orderItemList = new ArrayList<>();

        for (CartItem ci : cartItemList){
            if (ci.getWork().getStatus().equals(WorkStatus.INACTIVE)){
                errors.add(new ErrorDetail(ErrorCode.WORK_INACTIVE, "order", "o serviço " + ci.getWork().getTitle() + " está indisponivel"));
            }
            OrderItem orderItem = new OrderItem();
            orderItem.setAmount(ci.getAmount());
            orderItem.setWork(ci.getWork());
            orderItem.setCreatedAt(LocalDate.now());
            orderItem.setDeadlineDate(LocalDate.now().plusWeeks(2));
            orderItem.setUnitPrice(ci.getWork().getPrice().doubleValue());
            orderItem.setTotalPrice(ci.getAmount() * ci.getWork().getPrice().doubleValue());
            orderItemList.add(orderItem);
            orderItem.setOrder(order);
        }

        order.setCreatedAt(LocalDate.now());
        order.setStatus(OrderStatus.NOT_PAID);
        order.setUser(user);
        order.setPaymentMethod(makeOrderDTO.getPaymentMethod());

        double total = 0;
        for (OrderItem orderItem : orderItemList){
            total += orderItem.getTotalPrice();
        }

        order.setTotalPrice(total);
        order.setOrderItemlist(orderItemList);

        return saveOrder(order);
    }

    public List<OrderItem> findPendingDeliveries(Long freelancerId){
        return orderItemRepository.findPendingDeliveries(freelancerId);
    }

    public List<OrderItem> findDeliveries(Long freelancerId){
        return orderItemRepository.findDeliveries(freelancerId);
    }

}
