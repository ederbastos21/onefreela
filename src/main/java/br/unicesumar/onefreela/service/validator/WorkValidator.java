package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class WorkValidator {

    public List<ErrorDetail> validateSearch(BigDecimal minPrice, BigDecimal maxPrice) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "minPrice", "Preço mínimo não pode ser negativo"));
        }

        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "maxPrice", "Preço máximo não pode ser negativo"));
        }

        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_RANGE_INVALID, "price", "Preço mínimo não pode ser maior que o preço máximo"));
        }

        return errors;
    }
}