package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.dto.MakeOrderDTO;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/order")
public class OrderController {

    private final AuthService authService;
    private final OrderService orderService;

    public OrderController (AuthService authService, OrderService orderService){
        this.authService = authService;
        this.orderService = orderService;
    }
    @PostMapping("/createOrder")
    public ResponseEntity<?> createOrder (HttpServletRequest httpServletRequest, @RequestBody MakeOrderDTO makeOrderDTO){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        Order order = orderService.makeOrder(user, makeOrderDTO);
        return ResponseEntity.ok().body(order);
    }

    @GetMapping("/findDeliveries")
    public ResponseEntity<?> findDeliveries (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        List<OrderItem> orders = orderService.findDeliveries(user.getId());
        return ResponseEntity.ok().body(orders);
    }

    @GetMapping("/findPendingDeliveries")
    public ResponseEntity<?> findPendingDeliveries (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        List<OrderItem> orders = orderService.findPendingDeliveries(user.getId());
        return ResponseEntity.ok().body(orders);
    }

    @PostMapping("/makeDelivery")
    public ResponseEntity<?> makeDelivery (HttpServletRequest httpServletRequest, @ModelAttribute DeliverDTO deliver){
        User user = authService.getAuthenticatedUser(httpServletRequest);

    }

}
