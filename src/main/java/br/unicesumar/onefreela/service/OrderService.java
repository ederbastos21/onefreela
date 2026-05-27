package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
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

    public Order saveOrder (Order order){
        return orderRepository.save(order);
    }


    public Order makeOrder (User user){
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

        double total = 0;
        for (OrderItem orderItem : orderItemList){
            total += orderItem.getTotalPrice();
        }

        order.setTotalPrice(total);
        order.setOrderItemlist(orderItemList);

        return saveOrder(order);
    }
}
