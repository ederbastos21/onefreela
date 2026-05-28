package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.CardPaymentMethodDTO;
import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.PixPaymentMethodDTO;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.Payment;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.enums.PaymentStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService (PaymentRepository paymentRepository){
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public Payment makePayment (User user, Order order){
        double paymentFee = 0.03;

        List<ErrorDetail> errors = new ArrayList<>();

        if (!(order.getUser().getId().equals(user.getId()))){
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "payment", "erro de permissao"));
            throw new ValidationException(errors);
        }

        Payment payment = new Payment();
        payment.setPaymentMethod(order.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDENT);
        payment.setValue(order.getTotalPrice());
        payment.setOrder(order);
        payment.setValue(order.getTotalPrice());
        payment.setReleasedAt(null);
        payment.setPlatformFee(paymentFee);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment processPaymentCard (Payment payment, CardPaymentMethodDTO cardPaymentMethodDTO){
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDate.now());
        return paymentRepository.save(payment);
    }

    public Payment processPaymentPix (Payment payment, PixPaymentMethodDTO pixPaymentMethodDTO){
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDate.now());
        return paymentRepository.save(payment);
    }
}
