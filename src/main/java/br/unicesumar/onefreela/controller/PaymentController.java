package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.CardPaymentMethodDTO;
import br.unicesumar.onefreela.dto.PixPaymentMethodDTO;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.Payment;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.OrderService;
import br.unicesumar.onefreela.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/payment")
public class PaymentController {

    private final AuthService authService;
    private final PaymentService paymentService;
    private final OrderService orderService;

    public PaymentController (AuthService authService, PaymentService paymentService, OrderService orderService){
        this.authService = authService;
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    @Transactional
    @PostMapping("/makePaymentCard")
    public ResponseEntity<?> makePaymentCard (HttpServletRequest httpServletRequest, @RequestBody CardPaymentMethodDTO cardPaymentMethodDTO){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        Order order = orderService.findById(cardPaymentMethodDTO.getOrderId());
        Payment payment = paymentService.makePayment(user, order);
        Payment createdPayment = paymentService.processPaymentCard(payment, cardPaymentMethodDTO);
        return ResponseEntity.ok().body(createdPayment);
    }

    @Transactional
    @PostMapping("/makePaymentPix")
    public ResponseEntity<?> makePaymentPix (HttpServletRequest httpServletRequest, @RequestBody PixPaymentMethodDTO pixPaymentMethodDTO){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        Order order = orderService.findById(pixPaymentMethodDTO.getOrderId());
        Payment payment = paymentService.makePayment(user, order);
        Payment createdPayment = paymentService.processPaymentPix(payment, pixPaymentMethodDTO);
        return ResponseEntity.ok().body(createdPayment);
    }
}
