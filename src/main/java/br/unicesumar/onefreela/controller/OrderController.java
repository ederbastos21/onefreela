package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.CartItem;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.repository.OrderRepository;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

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
    public ResponseEntity<?> createOrder (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        orderService.makeOrder(user);
        return ResponseEntity.ok().body("deu boa criar order");
    }

}
