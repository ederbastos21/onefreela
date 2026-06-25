package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/delivery")
public class DeliveryController {

    private final AuthService authService;
    private final DeliveryService deliveryService;

    public DeliveryController(AuthService authService, DeliveryService deliveryService) {
        this.authService = authService;
        this.deliveryService = deliveryService;
    }

    @GetMapping("/findPending")
    public ResponseEntity<?> findPending(HttpServletRequest httpServletRequest) {
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findPendingDeliveries(user));
    }

    @GetMapping("/findOnDispute")
    public ResponseEntity<?> findOnDispute(HttpServletRequest httpServletRequest) {
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findOnDispute(user));
    }

    @GetMapping("/findPendingAdjustments")
    public ResponseEntity<?> findPendingAdjustment(HttpServletRequest httpServletRequest) {
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findPendingAdjustments(user));
    }

    @GetMapping("/findCompleted")
    public ResponseEntity<?> findCompleted(HttpServletRequest httpServletRequest) {
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok().body(deliveryService.findCompleted(user));
    }

    @GetMapping("/myActiveItems")
    public ResponseEntity<?> myActiveItems(HttpServletRequest httpServletRequest) {
        User user = authService.getAuthenticatedUser(httpServletRequest);
        return ResponseEntity.ok(deliveryService.findAllItems(user));
    }
}
