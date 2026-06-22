package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.OrderCreateDTO;
import br.unicesumar.onefreela.dto.OrderResponse;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import br.unicesumar.onefreela.repository.OrderRepository;
import br.unicesumar.onefreela.repository.WorkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final WorkRepository workRepository;
    private final PaymentService paymentService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        WorkRepository workRepository,
                        PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.workRepository = workRepository;
        this.paymentService = paymentService;
    }

    @Transactional
    public OrderResponse createOrder(User client, OrderCreateDTO dto) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (dto.getWorkIds() == null || dto.getWorkIds().isEmpty()) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_NOT_FOUND, "workIds", "O pedido deve conter ao menos um serviço"));
            throw new ValidationException(errors);
        }

        List<Work> works = workRepository.findAllById(dto.getWorkIds());

        for (Long workId : dto.getWorkIds()) {
            boolean found = works.stream().anyMatch(w -> w.getId().equals(workId));
            if (!found) {
                errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "workIds",
                        "Serviço com id " + workId + " não encontrado"));
            }
        }

        for (Work work : works) {
            if (work.getStatus() != WorkStatus.ACTIVE) {
                errors.add(new ErrorDetail(ErrorCode.WORK_INACTIVE, "workIds",
                        "O serviço '" + work.getTitle() + "' não está disponível"));
            }
            if (work.getOwner().getId().equals(client.getId())) {
                errors.add(new ErrorDetail(ErrorCode.WORK_BELONGS_TO_CLIENT, "workIds",
                        "Você não pode contratar seu próprio serviço: '" + work.getTitle() + "'"));
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        BigDecimal total = works.stream()
                .map(Work::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = new Order();
        order.setClient(client);
        order.setTotalAmount(total);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        Order savedOrder = orderRepository.save(order);

        for (Work work : works) {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setWork(work);
            item.setFreelancer(work.getOwner());
            item.setPrice(work.getPrice());
            item.setStatus(OrderItemStatus.PENDING);
            savedOrder.getItems().add(orderItemRepository.save(item));
        }

        return OrderResponse.fromEntity(savedOrder);
    }

    @Transactional
    public OrderResponse payOrder(User client, Long orderId, PaymentMethod paymentMethod) {
        List<ErrorDetail> errors = new ArrayList<>();

        Order order = findOrderOrThrow(orderId);

        if (!order.getClient().getId().equals(client.getId())) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "order", "Você não tem permissão para pagar este pedido"));
            throw new ValidationException(errors);
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ALREADY_PAID, "order", "Este pedido já foi pago ou não pode ser pago"));
            throw new ValidationException(errors);
        }

        paymentService.processPayment(order, paymentMethod);

        order.setPaymentMethod(paymentMethod);
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        for (OrderItem item : order.getItems()) {
            item.setStatus(OrderItemStatus.IN_PROGRESS);
            orderItemRepository.save(item);
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse completeOrderItem(User requester, Long orderId, Long itemId) {
        List<ErrorDetail> errors = new ArrayList<>();

        Order order = findOrderOrThrow(orderId);

        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_NOT_PAID, "order", "O pedido ainda não foi pago"));
            throw new ValidationException(errors);
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElse(null);

        if (item == null) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_FOUND, "orderItem", "Item não encontrado neste pedido"));
            throw new ValidationException(errors);
        }

        boolean isFreelancerOfItem = item.getFreelancer().getId().equals(requester.getId());
        boolean isClientOfOrder = order.getClient().getId().equals(requester.getId());
        boolean isAdmin = requester.getAdmin();

        if (!isFreelancerOfItem && !isClientOfOrder && !isAdmin) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "orderItem", "Você não tem permissão para concluir este item"));
            throw new ValidationException(errors);
        }

        if (item.getStatus() == OrderItemStatus.COMPLETED) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_ALREADY_COMPLETED, "orderItem", "Este item já foi concluído"));
            throw new ValidationException(errors);
        }
        if (item.getStatus() != OrderItemStatus.IN_PROGRESS) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_IN_PROGRESS, "orderItem", "Este item não está em andamento"));
            throw new ValidationException(errors);
        }

        paymentService.distributeOrderItemFunds(item);

        item.setStatus(OrderItemStatus.COMPLETED);
        orderItemRepository.save(item);

        updateOrderStatusAfterItemChange(order);

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse refundOrderItem(User requester, Long orderId, Long itemId) {
        List<ErrorDetail> errors = new ArrayList<>();

        Order order = findOrderOrThrow(orderId);

        boolean isClientOfOrder = order.getClient().getId().equals(requester.getId());
        boolean isAdmin = requester.getAdmin();

        if (!isClientOfOrder && !isAdmin) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "order", "Você não tem permissão para reembolsar este pedido"));
            throw new ValidationException(errors);
        }

        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_NOT_PAID, "order", "O pedido não foi pago e não requer reembolso"));
            throw new ValidationException(errors);
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElse(null);

        if (item == null) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_FOUND, "orderItem", "Item não encontrado neste pedido"));
            throw new ValidationException(errors);
        }

        paymentService.refundOrderItem(item);

        item.setStatus(OrderItemStatus.REFUNDED);
        orderItemRepository.save(item);

        updateOrderStatusAfterItemChange(order);

        return OrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findMyOrders(User client) {
        return orderRepository.findByClientId(client.getId())
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(User requester, Long orderId) {
        List<ErrorDetail> errors = new ArrayList<>();
        Order order = findOrderOrThrow(orderId);

        boolean isClient = order.getClient().getId().equals(requester.getId());
        boolean isFreelancerInOrder = order.getItems().stream()
                .anyMatch(i -> i.getFreelancer().getId().equals(requester.getId()));
        boolean isAdmin = requester.getAdmin();

        if (!isClient && !isFreelancerInOrder && !isAdmin) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "order", "Você não tem acesso a este pedido"));
            throw new ValidationException(errors);
        }

        return OrderResponse.fromEntity(order);
    }

    private Order findOrderOrThrow(Long orderId) {
        return orderRepository.findById(orderId).orElseThrow(() -> {
            List<ErrorDetail> errors = new ArrayList<>();
            errors.add(new ErrorDetail(ErrorCode.ORDER_NOT_FOUND, "order", "Pedido não encontrado"));
            return new ValidationException(errors);
        });
    }

    private void updateOrderStatusAfterItemChange(Order order) {
        List<OrderItem> items = order.getItems();
        long completedCount = items.stream().filter(i -> i.getStatus() == OrderItemStatus.COMPLETED).count();
        long refundedCount = items.stream().filter(i -> i.getStatus() == OrderItemStatus.REFUNDED).count();
        long cancelledCount = items.stream().filter(i -> i.getStatus() == OrderItemStatus.CANCELLED).count();
        long total = items.size();
        long resolvedCount = completedCount + refundedCount + cancelledCount;

        if (completedCount == total) {
            order.setStatus(OrderStatus.COMPLETED);
        } else if (resolvedCount == total) {
            order.setStatus(OrderStatus.REFUNDED);
        } else if (completedCount > 0) {
            order.setStatus(OrderStatus.PARTIALLY_COMPLETED);
        }

        orderRepository.save(order);
    }
}
