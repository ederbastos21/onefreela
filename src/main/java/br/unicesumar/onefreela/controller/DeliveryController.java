package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.DeliveryService;
import br.unicesumar.onefreela.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@Controller
public class DeliveryController {

    private final AuthService authService;
    private final DeliveryService deliveryService;

    public DeliveryController (AuthService authService, DeliveryService deliveryService){
        this.authService = authService;
        this.deliveryService = deliveryService;
    }

    @GetMapping("/findDeliveries")
    public ResponseEntity<?> findDeliveries (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
    }

    @GetMapping("/findPendingDeliveries")
    public ResponseEntity<?> findPendingDeliveries (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
    }

    @PostMapping("/makeDelivery")
    public ResponseEntity<?> makeDelivery (HttpServletRequest httpServletRequest, @ModelAttribute DeliverDTO deliverDto){
        User user = authService.getAuthenticatedUser(httpServletRequest);
    }
}
