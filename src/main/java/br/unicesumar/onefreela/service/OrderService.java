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

    private boolean isWorkOwner(User user, OrderItem orderItem){
        return orderItem.getWork().getOwner().getId().equals(user.getId());
    }

    private boolean isOrderOwner(User user, OrderItem orderItem){
        return orderItem.getOrder().getUser().getId().equals(user.getId());
    }

    private boolean reachedMaxDeliveryTries(OrderItem orderItem, int max){
        return orderItem.getDeliveryTries() >= max;
    }

    private boolean hasStatus(OrderItem orderItem, OrderItemStatus status){
        return orderItem.getStatus().equals(status);
    }

    private boolean canMakeDelivery(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.PENDING_DELIVERY);
    }

    private boolean canAcceptDelivery(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.PENDING_DELIVERY_REVISION);
    }

    private boolean canRequestAdjustment(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.PENDING_DELIVERY_REVISION);
    }

    private boolean canAcceptAdjustment(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.ADJUSTMENT_REQUEST);
    }

    private boolean canOpenDispute(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.PENDING_DELIVERY_REVISION);
    }

    private boolean isCompleted(OrderItem orderItem){
        return hasStatus(orderItem, OrderItemStatus.COMPLETED);
    }

    public List<Order> findAllOrders (){
        return orderRepository.findAll();
    }


    public Order makeOrder (User user, MakeOrderDTO makeOrderDTO){
        List<ErrorDetail> errors = new ArrayList<>();
        Cart cart = user.getCart();
        if (cart == null){
            errors.add(new ErrorDetail(ErrorCode.CART_NOT_FOUND, "order", "O carrinho nao foi encontrado"));
        }
        List<CartItem> cartItemList = cart.getCartItemList();

        if (cartItemList.isEmpty()){
            errors.add(new ErrorDetail(ErrorCode.CART_EMPTY, "order", "o carrinho nao possui nenhum item"));
            throw new ValidationException(errors);
        }

        Order order = new Order();
        List <OrderItem> orderItemList = new ArrayList<>();

        for (CartItem ci : cartItemList){
            boolean isAvailable = true;
            if (ci.getWork().getStatus().equals(WorkStatus.INACTIVE)){
                errors.add(new ErrorDetail(ErrorCode.WORK_INACTIVE, "order", "o serviço " + ci.getWork().getTitle() + " está indisponivel"));
                isAvailable = false;
            }
            if (isAvailable) {
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
        }

        if (errors.isEmpty()){
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
        throw new ValidationException(errors);
    }

    @Transactional
    public Delivery makeDelivery (User user, DeliverDTO deliverDto){
        int MAX_DELIVERY_TRIES = 3;
        OrderItem orderItem = findOrderItemById(deliverDto.getOrderItemId());
        List<ErrorDetail> errors = new ArrayList<>();
        Delivery delivery = new Delivery();

        if (orderItem == null){
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_FOUND, "delivery", "O pedido nao foi encontrado"));
            throw new ValidationException(errors);
        }

        if (reachedMaxDeliveryTries(orderItem, MAX_DELIVERY_TRIES)){
            errors.add(new ErrorDetail(ErrorCode.DELIVERY_TOO_MANY_TRIES, "delivery", "O limite de envio é de 3 tentativas, espere o retorno do cliente"));
            throw new ValidationException(errors);
        }

        if (!canMakeDelivery(orderItem)){
            errors.add(new ErrorDetail(ErrorCode.NO_PENDING_DELIVERY, "delivery", "Nao há nenhum envio de arquivos pendente"));
            throw new ValidationException(errors);
        }

        if (!isWorkOwner(user, orderItem)){
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        delivery.setMessage(deliverDto.getMessage());
        delivery.setOrderItem(orderItem);
        Delivery savedDelivery = deliveryService.save(delivery);

        List <MultipartFile> files = deliverDto.getFiles();

        if (files != null){
            for (MultipartFile file : files){
                DeliveryFile deliveryFile = new DeliveryFile();

                deliveryFile.setDelivery(savedDelivery);
                deliveryFile.setFileSize(file.getSize());
                deliveryFile.setExtension(file.getContentType());
                deliveryFile.setOriginalName(file.getName());
                deliveryFile.setUploadedAt(LocalDate.now());
                deliveryFile.setPath(deliveryFileStorageService.store(file));
                savedDelivery.getFileList().add(deliveryFile);
            }
        } else {
            errors.add(new ErrorDetail(ErrorCode.DELIVERY_FILE_EMPTY, "delivery", "nenhum arquivo de envio encontrado"));
            throw new ValidationException(errors);
        }

        deliveryService.save(savedDelivery);

        orderItem.setDeliveryTries(orderItem.getDeliveryTries() + 1);
        orderItem.setStatus(OrderItemStatus.PENDING_DELIVERY_REVISION);
        saveOrderItem(orderItem);

        return delivery;
    }

    @Transactional
    public OrderItem refuseAdjustmentRequest (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!canAcceptAdjustment(orderItem)){
            errors.add(new ErrorDetail(ErrorCode.NO_PENDING_ADJUSTMENT_REQUEST, "delivey", "nao há nenhum ajuste pendente"));
            throw new ValidationException(errors);
        }

        if (!isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        orderItem.setStatus(OrderItemStatus.FROZEN);
        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem acceptAdjustmentRequest (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!canAcceptAdjustment(orderItem)){
            errors.add(new ErrorDetail(ErrorCode.NO_PENDING_ADJUSTMENT_REQUEST, "delivey", "nao há nenhum ajuste pendente"));
            throw new ValidationException(errors);
        }

        if (!isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        orderItem.setStatus(OrderItemStatus.PENDING_DELIVERY);
        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem openDispute (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "nao pode abrir disputa em seu proprio pedido"));
            throw new ValidationException(errors);
        }

        if (isOrderOwner(user, orderItem)){
            orderItem.setStatus(OrderItemStatus.ON_DISPUTE);
            saveOrderItem(orderItem);
        }

        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem acceptDelivery (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!canAcceptDelivery(orderItem)){
            errors.add(new ErrorDetail(ErrorCode.NO_PENDING_DELIVERY_REVIEW, "delivery", "nao há nenhum pedido de revisao pendente"));
            throw new ValidationException(errors);
        }

        if (isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "nao pode aceitar seu proprio serviço"));
            throw new ValidationException(errors);
        }

        if (!isOrderOwner(user, orderItem)){
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        orderItem.setStatus(OrderItemStatus.COMPLETED);
        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem refuseDelivery (User user, Long orderItemId){
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!canAcceptDelivery(orderItem)){
            errors.add(new ErrorDetail(ErrorCode.NO_PENDING_DELIVERY_REVIEW, "delivery", "nao há nenhum pedido com revisao pendente"));
            throw new ValidationException(errors);
        }

        if (isWorkOwner(user, orderItem)){
            errors.add (new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "nao pode recusar seu proprio serviço"));
        }

        if (!isOrderOwner(user, orderItem)){
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "acesso negado"));
            throw new ValidationException(errors);
        }

        if (orderItem.getDeliveryTries() == 3){
            orderItem.setStatus(OrderItemStatus.FROZEN);
            return saveOrderItem(orderItem);
        }

        orderItem.setStatus(OrderItemStatus.ADJUSTMENT_REQUEST);
        return saveOrderItem(orderItem);
    }
}
