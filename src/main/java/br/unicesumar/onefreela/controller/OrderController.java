package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.OrderCreateDTO;
import br.unicesumar.onefreela.dto.OrderResponse;
import br.unicesumar.onefreela.dto.PayOrderDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    public OrderController(OrderService orderService, AuthService authService) {
        this.orderService = orderService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(HttpServletRequest request,
                                                     @Valid @RequestBody OrderCreateDTO dto) {
        User client = authService.getAuthenticatedUser(request);
        OrderResponse response = orderService.createOrder(client, dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/pay")
    public ResponseEntity<OrderResponse> payOrder(HttpServletRequest request,
                                                  @PathVariable Long orderId,
                                                  @Valid @RequestBody PayOrderDTO dto) {
        User client = authService.getAuthenticatedUser(request);
        OrderResponse response = orderService.payOrder(client, orderId, dto.getPaymentMethod());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/items/{itemId}/complete")
    public ResponseEntity<OrderResponse> completeItem(HttpServletRequest request,
                                                      @PathVariable Long orderId,
                                                      @PathVariable Long itemId) {
        User requester = authService.getAuthenticatedUser(request);
        OrderResponse response = orderService.completeOrderItem(requester, orderId, itemId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/items/{itemId}/refund")
    public ResponseEntity<OrderResponse> refundItem(HttpServletRequest request,
                                                    @PathVariable Long orderId,
                                                    @PathVariable Long itemId) {
        User requester = authService.getAuthenticatedUser(request);
        OrderResponse response = orderService.refundOrderItem(requester, orderId, itemId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> myOrders(HttpServletRequest request) {
        User client = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(orderService.findMyOrders(client));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(HttpServletRequest request,
                                                  @PathVariable Long orderId) {
        User requester = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(orderService.findById(requester, orderId));
    }
}
