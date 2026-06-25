package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.MakeOrderDTO;
import br.unicesumar.onefreela.dto.UserOrderDTO;
import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import br.unicesumar.onefreela.enums.OrderStatus;
import br.unicesumar.onefreela.enums.WorkStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import br.unicesumar.onefreela.repository.OrderRepository;
import br.unicesumar.onefreela.repository.WorkAdditionalRepository;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final DeliveryService deliveryService;
    private final DeliveryFileStorageService deliveryFileStorageService;
    private final WorkAdditionalRepository workAdditionalRepository;
    private final PaymentService paymentService;

    public OrderService(OrderItemRepository orderItemRepository, OrderRepository orderRepository,
                        DeliveryService deliveryService, DeliveryFileStorageService deliveryFileStorageService,
                        WorkAdditionalRepository workAdditionalRepository,
                        @Lazy PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.deliveryService = deliveryService;
        this.deliveryFileStorageService = deliveryFileStorageService;
        this.workAdditionalRepository = workAdditionalRepository;
        this.paymentService = paymentService;
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

    public List<Order> findAllOrders() {
        return orderRepository.findAll();
    }

    public List<UserOrderDTO> getMyOrders(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(UserOrderDTO::fromEntity)
                .toList();
    }


    @Transactional
    public Order makeOrder(User user, MakeOrderDTO dto) {

        List<ErrorDetail> errors = new ArrayList<>();

        Cart cart = user.getCart();

        if (cart == null) {
            errors.add(new ErrorDetail(ErrorCode.CART_NOT_FOUND, "order", "Carrinho não encontrado"));
            throw new ValidationException(errors);
        }

        if (cart.getCartItemList() == null || cart.getCartItemList().isEmpty()) {
            errors.add(new ErrorDetail(ErrorCode.CART_EMPTY, "order", "Carrinho vazio"));
            throw new ValidationException(errors);
        }

        if (dto.getCartItemIds() == null || dto.getCartItemIds().isEmpty()) {
            errors.add(new ErrorDetail(ErrorCode.CART_EMPTY, "order", "Nenhum item selecionado"));
            throw new ValidationException(errors);
        }

        List<CartItem> selectedItems = cart.getCartItemList()
                .stream()
                .filter(ci -> dto.getCartItemIds().contains(ci.getId()))
                .toList();

        if (selectedItems.size() != dto.getCartItemIds().size()) {
            errors.add(new ErrorDetail(
                    ErrorCode.CART_ITEM_ID_NOT_FOUND,
                    "order",
                    "Um ou mais itens não pertencem ao carrinho"
            ));
            throw new ValidationException(errors);
        }

        Order order = new Order();
        List<OrderItem> orderItems = new ArrayList<>();
        double totalOrderPrice = 0;


        for (CartItem ci : selectedItems) {

            Work work = ci.getWork();

            if (work == null) {
                errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "order", "Serviço não encontrado"));
                continue;
            }

            if (work.getStatus() == WorkStatus.INACTIVE) {
                errors.add(new ErrorDetail(
                        ErrorCode.WORK_INACTIVE,
                        "order",
                        "Serviço " + work.getTitle() + " está indisponível"
                ));
                continue;
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setWork(work);
            orderItem.setAmount(ci.getAmount());
            orderItem.setCreatedAt(LocalDate.now());
            orderItem.setDeadlineDate(LocalDate.now().plusWeeks(2));
            orderItem.setStatus(OrderItemStatus.PENDING_DELIVERY);

            double basePrice = work.getPrice().doubleValue();
            double totalItemPrice = basePrice * ci.getAmount();

            orderItem.setUnitPrice(basePrice);

            List<Long> additionalIds = dto.getAdditionalsByCartItem() != null
                    ? dto.getAdditionalsByCartItem().get(ci.getId())
                    : null;

            if (additionalIds != null && !additionalIds.isEmpty()) {

                Set<Long> uniqueIds = new HashSet<>(additionalIds);
                if (uniqueIds.size() != additionalIds.size()) {
                    errors.add(new ErrorDetail(
                            ErrorCode.WORK_ADDITIONAL_DUPLICATED,
                            "order",
                            "Adicional duplicado no item " + ci.getId()
                    ));
                    continue;
                }

                List<WorkAdditional> additionals = workAdditionalRepository.findAllById(additionalIds);

                for (Long addId : additionalIds) {

                    WorkAdditional wa = additionals.stream()
                            .filter(a -> a.getId().equals(addId))
                            .findFirst()
                            .orElse(null);

                    if (wa == null) {
                        errors.add(new ErrorDetail(
                                ErrorCode.WORK_ADDITIONAL_NOT_FOUND,
                                "order",
                                "Adicional não encontrado: " + addId
                        ));
                        continue;
                    }

                    if (!wa.getWork().getId().equals(work.getId())) {
                        errors.add(new ErrorDetail(
                                ErrorCode.WORK_ADDITIONAL_DOES_NOT_BELONG_TO_WORK,
                                "order",
                                "Adicional não pertence ao serviço"
                        ));
                        continue;
                    }

                    OrderItemAdditional oia = new OrderItemAdditional();
                    oia.setOrderItem(orderItem);
                    oia.setWorkAdditional(wa);
                    oia.setPrice(wa.getPrice().doubleValue());

                    orderItem.getAdditionals().add(oia);

                    totalItemPrice += wa.getPrice().doubleValue();
                }
            }

            orderItem.setTotalPrice(totalItemPrice);
            totalOrderPrice += totalItemPrice;

            orderItems.add(orderItem);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        order.setUser(user);
        order.setCreatedAt(LocalDate.now());
        order.setStatus(OrderStatus.NOT_PAID);
        order.setPaymentMethod(dto.getPaymentMethod());
        order.setTotalPrice(totalOrderPrice);
        order.setOrderItemlist(orderItems);

        return orderRepository.save(order);
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
                deliveryFile.setOriginalName(file.getOriginalFilename());
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
    public OrderItem openDispute(User user, Long orderItemId) {
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!hasStatus(orderItem, OrderItemStatus.FROZEN)) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_DISPUTE_STATUS, "orderItem",
                    "Disputa so pode ser aberta quando o item esta no estado FROZEN"));
            throw new ValidationException(errors);
        }

        if (isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "orderItem", "Freelancer nao pode abrir disputa em seu proprio pedido"));
            throw new ValidationException(errors);
        }

        if (!isOrderOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "orderItem", "acesso negado"));
            throw new ValidationException(errors);
        }

        orderItem.setStatus(OrderItemStatus.ON_DISPUTE);
        return saveOrderItem(orderItem);
    }

    @Transactional
    public OrderItem acceptFrozenDelivery(User user, Long orderItemId) {
        List<ErrorDetail> errors = new ArrayList<>();
        OrderItem orderItem = findOrderItemById(orderItemId);

        if (!hasStatus(orderItem, OrderItemStatus.FROZEN)) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_DISPUTE_STATUS, "orderItem",
                    "Aceitar entrega apos freeze so e possivel quando o item esta no estado FROZEN"));
            throw new ValidationException(errors);
        }

        if (isWorkOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "orderItem", "Freelancer nao pode aceitar sua propria entrega"));
            throw new ValidationException(errors);
        }

        if (!isOrderOwner(user, orderItem)) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "orderItem", "acesso negado"));
            throw new ValidationException(errors);
        }

        orderItem.setStatus(OrderItemStatus.COMPLETED);
        OrderItem saved = saveOrderItem(orderItem);
        paymentService.distributeOrderItemFunds(saved);
        return saved;
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
        OrderItem saved = saveOrderItem(orderItem);
        paymentService.distributeOrderItemFunds(saved);
        return saved;
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
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "delivery", "nao pode recusar seu proprio serviço"));
            throw new ValidationException(errors);
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
