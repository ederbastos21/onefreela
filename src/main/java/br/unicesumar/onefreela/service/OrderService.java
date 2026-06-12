package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.MakeOrderDTO;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import br.unicesumar.onefreela.enums.OrderStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import br.unicesumar.onefreela.repository.OrderRepository;
import jakarta.transaction.Transactional;
import org.aspectj.weaver.ast.Or;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final DeliveryService deliveryService;
    private final DeliveryFileStorageService deliveryFileStorageService;

    public OrderService (OrderItemRepository orderItemRepository, OrderRepository orderRepository, DeliveryService deliveryService, DeliveryFileStorageService deliveryFileStorageService){
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.deliveryService = deliveryService;
        this.deliveryFileStorageService = deliveryFileStorageService;
    }

    public Order findOrderById(Long id){
        return orderRepository.findById(id).orElseThrow();
    }

    public OrderItem findOrderItemById(Long id){
        return orderItemRepository.findById(id).orElseThrow();
    }

    public Order saveOrder (Order order){
        return orderRepository.save(order);
    }

    public OrderItem saveOrderItem (OrderItem orderItem){
        return orderItemRepository.save(orderItem);
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

    @Transactional
    public Delivery makeDelivery (User user, DeliverDTO deliverDto){
        int MAX_DELIVERY_TRIES = 3;
        OrderItem orderItem = findOrderItemById(deliverDto.getOrderItemId());
        List<ErrorDetail> errors = new ArrayList<>();

        if (orderItem == null){
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_FOUND, "delivery", "Nao foi encontrado nenhum pedido"));
            throw new ValidationException(errors);
        }

        if (orderItem.getDeliveryTries() >= MAX_DELIVERY_TRIES){
            errors.add(new ErrorDetail(ErrorCode.DELIVERY_TOO_MANY_TRIES, "delivery", "O limite de envio é de 3 tentativas"));
        }

        Delivery delivery = new Delivery();

        if (delivery.getOrderItem().getWork().getOwner().equals(user)){
            delivery.setMessage(deliverDto.getMessage());
            delivery.setOrderItem(orderItem);
            Delivery savedDelivery = deliveryService.save(delivery);

            List <MultipartFile> files = deliverDto.getFiles();

            for (MultipartFile file : files){
                DeliveryFile deliveryFile = new DeliveryFile();

                deliveryFile.setDelivery(savedDelivery);
                deliveryFile.setFileSize(file.getSize());
                deliveryFile.setExtension(file.getContentType());
                deliveryFile.setOriginalName(file.getName());
                deliveryFile.setUploadedAt(LocalDate.now());
                deliveryFile.setPath(deliveryFileStorageService.store(file));
                delivery.getFileList().add(deliveryFile);
            }

            deliveryService.save(delivery);

            orderItem.setDeliveryTries(orderItem.getDeliveryTries() + 1);
            orderItem.setStatus(OrderItemStatus.PENDING_DELIVERY_REVISION);
            orderItemRepository.save(orderItem);
        }
        else {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }
        return delivery;
    }

    @Transactional
    public OrderItem refuseAdjustment (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (orderItem.getWork().getOwner().equals(user)) {
            orderItem.setStatus(OrderItemStatus.ADJUSTMENT_REFUSED);
        } else {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem openDispute (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (orderItem.getWork().getOwner().equals(user)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "nao pode abrir disputa em seu proprio pedido"));
            throw new ValidationException(errors);
        } else {
            if (orderItem.getOrder().getUser() == user){
                orderItem.setStatus(OrderItemStatus.ON_DISPUTE);
                saveOrderItem(orderItem);
            }
        }

        return saveOrderItem(orderItem);
    }
}
