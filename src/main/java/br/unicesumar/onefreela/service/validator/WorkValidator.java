package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class WorkValidator {

    private List<ErrorDetail> isValidTitle(String title) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (title == null || title.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.WORK_TITLE_REQUIRED, "title", "O título é obrigatório"));
            return errors;
        }

        if (title.length() < 5) {
            errors.add(new ErrorDetail(ErrorCode.WORK_TITLE_TOO_SHORT, "title", "O título deve ter pelo menos 5 caracteres"));
        }

        if (title.length() > 100) {
            errors.add(new ErrorDetail(ErrorCode.WORK_TITLE_TOO_LONG, "title", "O título deve ter no máximo 100 caracteres"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidDescription(String description) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (description == null || description.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.WORK_DESCRIPTION_REQUIRED, "description", "A descrição é obrigatória"));
            return errors;
        }

        if (description.length() < 20) {
            errors.add(new ErrorDetail(ErrorCode.WORK_DESCRIPTION_TOO_SHORT, "description", "A descrição deve ter pelo menos 20 caracteres"));
        }

        if (description.length() > 2000) {
            errors.add(new ErrorDetail(ErrorCode.WORK_DESCRIPTION_TOO_LONG, "description", "A descrição deve ter no máximo 2000 caracteres"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidCategory(String category) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (category == null || category.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.WORK_CATEGORY_REQUIRED, "category", "A categoria é obrigatória"));
            return errors;
        }

        if (category.length() > 100) {
            errors.add(new ErrorDetail(ErrorCode.WORK_CATEGORY_TOO_LONG, "category", "A categoria deve ter no máximo 100 caracteres"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidPrice(BigDecimal price) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (price == null) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_REQUIRED, "price", "O preço é obrigatório"));
            return errors;
        }

        if (price.compareTo(BigDecimal.ZERO) < 0) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "price", "O preço não pode ser negativo"));
        }

        return errors;
    }

    private List<ErrorDetail> validateBaseWorkData(String title, String description, String category, BigDecimal price) {
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(isValidTitle(title));
        errors.addAll(isValidDescription(description));
        errors.addAll(isValidCategory(category));
        errors.addAll(isValidPrice(price));

        return errors;
    }

    public List<ErrorDetail> validateRegister(WorkRegisterDTO workRegisterDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(validateBaseWorkData(
                workRegisterDTO.getTitle(),
                workRegisterDTO.getDescription(),
                workRegisterDTO.getCategory(),
                workRegisterDTO.getPrice()
        ));

        return errors;
    }

    public List<ErrorDetail> validateUpdate(WorkUpdateDTO workUpdateDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(validateBaseWorkData(
                workUpdateDTO.getTitle(),
                workUpdateDTO.getDescription(),
                workUpdateDTO.getCategory(),
                workUpdateDTO.getPrice()
        ));

        return errors;
    }

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