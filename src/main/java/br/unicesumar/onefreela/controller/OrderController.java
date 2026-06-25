package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.MakeOrderDTO;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/order")
public class OrderController {

    private final AuthService authService;
    private final OrderService orderService;

    public OrderController(AuthService authService, OrderService orderService) {
        this.authService  = authService;
        this.orderService = orderService;
    }

    @PostMapping("/createOrder")
    public ResponseEntity<?> createOrder(HttpServletRequest request, @RequestBody MakeOrderDTO makeOrderDTO) {
        User user   = authService.getAuthenticatedUser(request);
        Order order = orderService.makeOrder(user, makeOrderDTO);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/myOrders")
    public ResponseEntity<?> myOrders(HttpServletRequest request) {
        User user = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(orderService.getMyOrders(user));
    }
}
