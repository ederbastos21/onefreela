package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.WorkAdditionalDTO;
import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkReviewDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.enums.WorkStatus;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class WorkValidator {

    private static final int MAX_ADDITIONALS = 10;
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

    private List<ErrorDetail> validateAdditionals(List<WorkAdditionalDTO> additionals) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (additionals == null || additionals.isEmpty()) {
            return errors;
        }

        if (additionals.size() > MAX_ADDITIONALS) {
            errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_LIMIT_EXCEEDED, "additionals", "O serviço pode ter no máximo 10 adicionais"));
            return errors;
        }

        for (int i = 0; i < additionals.size(); i++) {
            WorkAdditionalDTO additional = additionals.get(i);

            if (additional.getTitle() == null || additional.getTitle().isBlank()) {
                errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_TITLE_REQUIRED, "additionals[" + i + "].title", "O título do adicional é obrigatório"));
            } else {
                if (additional.getTitle().length() < 5) {
                    errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_TITLE_TOO_SHORT, "additionals[" + i + "].title", "O título do adicional deve ter pelo menos 5 caracteres"));
                }
                if (additional.getTitle().length() > 100) {
                    errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_TITLE_TOO_LONG, "additionals[" + i + "].title", "O título do adicional deve ter no máximo 100 caracteres"));
                }
            }

            if (additional.getDescription() != null && additional.getDescription().length() > 1000) {
                errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_DESCRIPTION_TOO_LONG, "additionals[" + i + "].description", "A descrição do adicional deve ter no máximo 1000 caracteres"));
            }

            if (additional.getPrice() == null) {
                errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_PRICE_REQUIRED, "additionals[" + i + "].price", "O preço do adicional é obrigatório"));
            } else if (additional.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                errors.add(new ErrorDetail(ErrorCode.WORK_ADDITIONAL_PRICE_INVALID, "additionals[" + i + "].price", "O preço do adicional não pode ser negativo"));
            }
        }
        return errors;
    }

    public List<ErrorDetail> validateRegister(WorkRegisterDTO workRegisterDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(validateBaseWorkData(workRegisterDTO.getTitle(), workRegisterDTO.getDescription(), workRegisterDTO.getCategory(), workRegisterDTO.getPrice()));
        errors.addAll(validateAdditionals(workRegisterDTO.getAdditionals()));
        return errors;
    }

    public List<ErrorDetail> validateUpdate(WorkUpdateDTO workUpdateDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(validateBaseWorkData(workUpdateDTO.getTitle(), workUpdateDTO.getDescription(), workUpdateDTO.getCategory(), workUpdateDTO.getPrice()));
        errors.addAll(validateAdditionals(workUpdateDTO.getAdditionals()));
        return errors;
    }

    public List<ErrorDetail> validateReview(WorkReviewDTO workReviewDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (workReviewDTO.getStatus() == null || workReviewDTO.getStatus().isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.WORK_REVIEW_STATUS_REQUIRED, "status", "O status da revisão é obrigatório"));
            return errors;
        }

        try {
            WorkStatus status = WorkStatus.valueOf(workReviewDTO.getStatus());
            if (status != WorkStatus.ACTIVE && status != WorkStatus.REJECTED) {
                errors.add(new ErrorDetail(ErrorCode.WORK_REVIEW_STATUS_INVALID, "status", "A revisão deve aprovar ou rejeitar o serviço"));
            }
        } catch (IllegalArgumentException e) {
            errors.add(new ErrorDetail(ErrorCode.WORK_REVIEW_STATUS_INVALID, "status", "Status de revisão inválido"));
        }
        return errors;
    }

    public List<ErrorDetail> validateSearch(String q, String category, String minPrice, String maxPrice, String ownerId) {
        List<ErrorDetail> errors = new ArrayList<>();
        BigDecimal parsedMinPrice = null;
        BigDecimal parsedMaxPrice = null;

        if (q != null && q.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.VALIDATION_ERROR, "q", "Texto de pesquisa não pode ser vazio"));
        }

        if (category != null) {
            if (category.isBlank()) {
                errors.add(new ErrorDetail(ErrorCode.WORK_CATEGORY_REQUIRED, "category", "Categoria não pode ser vazia"));
            } else if (category.length() > 100) {
                errors.add(new ErrorDetail(ErrorCode.WORK_CATEGORY_TOO_LONG, "category", "A categoria deve ter no máximo 100 caracteres"));
            }
        }

        if (minPrice != null) {
            if (minPrice.isBlank()) {
                errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "minPrice", "Preço mínimo deve ser um número válido"));
            } else {
                try {
                    parsedMinPrice = new BigDecimal(minPrice);
                    if (parsedMinPrice.compareTo(BigDecimal.ZERO) < 0) {
                        errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "minPrice", "Preço mínimo não pode ser negativo"));
                    }
                } catch (NumberFormatException e) {
                    errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "minPrice", "Preço mínimo deve ser um número válido"));
                }
            }
        }

        if (maxPrice != null) {
            if (maxPrice.isBlank()) {
                errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "maxPrice", "Preço máximo deve ser um número válido"));
            } else {
                try {
                    parsedMaxPrice = new BigDecimal(maxPrice);
                    if (parsedMaxPrice.compareTo(BigDecimal.ZERO) < 0) {
                        errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "maxPrice", "Preço máximo não pode ser negativo"));
                    }
                } catch (NumberFormatException e) {
                    errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_INVALID, "maxPrice", "Preço máximo deve ser um número válido"));
                }
            }
        }

        if (parsedMinPrice != null && parsedMaxPrice != null && parsedMinPrice.compareTo(parsedMaxPrice) > 0) {
            errors.add(new ErrorDetail(ErrorCode.WORK_PRICE_RANGE_INVALID, "price", "Preço mínimo não pode ser maior que o preço máximo"));
        }

        if (ownerId != null) {
            if (ownerId.isBlank()) {
                errors.add(new ErrorDetail(ErrorCode.WORK_OWNER_INVALID, "ownerId", "Id do freelancer deve ser um número válido"));
            } else {
                try {
                    Long parsedOwnerId = Long.parseLong(ownerId);
                    if (parsedOwnerId <= 0) {
                        errors.add(new ErrorDetail(ErrorCode.WORK_OWNER_INVALID, "ownerId", "Id do freelancer deve ser maior que zero"));
                    }
                } catch (NumberFormatException e) {
                    errors.add(new ErrorDetail(ErrorCode.WORK_OWNER_INVALID, "ownerId", "Id do freelancer deve ser um número válido"));
                }
            }
        }
        return errors;
    }
}