package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.DeliveryService;
import br.unicesumar.onefreela.service.OrderService;
import br.unicesumar.onefreela.service.WorkService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/delivery")
public class DeliveryController {

    private final AuthService authService;
    private final DeliveryService deliveryService;
    private final OrderService orderService;

    public DeliveryController (AuthService authService, DeliveryService deliveryService, OrderService orderService){
        this.authService = authService;
        this.deliveryService = deliveryService;
        this.orderService = orderService;
    }

    @GetMapping("/findPending")
    public ResponseEntity<?> findPending (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findPendingDeliveries(user));
    }

    @GetMapping("/findOnDispute")
    public ResponseEntity<?> findOnDispute (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findOnDispute(user));
    }

    @GetMapping("/findPendingAdjustments")
    public ResponseEntity<?> findPendingAdjustment (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findPendingAdjustments(user));
    }

    @GetMapping("/findCompleted")
    public ResponseEntity<?> findCompleted (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findCompleted(user));
    }

    @PostMapping("/makeDelivery")
    public ResponseEntity<?> makeDelivery (HttpServletRequest httpServletRequest, @ModelAttribute DeliverDTO deliverDto){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(orderService.makeDelivery(user, deliverDto));
    }
    
}
