package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.WorkRepository;
import br.unicesumar.onefreela.service.validator.WorkValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class WorkService {

    private final WorkRepository repository;
    private final WorkValidator workValidator;

    public WorkService(WorkRepository repository, WorkValidator workValidator) {
        this.repository = repository;
        this.workValidator = workValidator;
    }

    @Transactional(readOnly = true)
    public List<WorkResponse> search(String q, String category, BigDecimal minPrice, BigDecimal maxPrice, Long ownerId) {
        List<ErrorDetail> errors = workValidator.validateSearch(minPrice, maxPrice);

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        String normalizedQ;
        if (q == null) {
            normalizedQ = null;
        } else {
            normalizedQ = q.trim();
        }
        
        String normalizedCategory;
        if (category == null) {
            normalizedCategory = null;
        } else {
            normalizedCategory = category.trim();
        }

        boolean hasQ = normalizedQ != null && !normalizedQ.isBlank();
        boolean hasCategory = normalizedCategory != null && !normalizedCategory.isBlank();

        List<Work> works;

        if (hasQ) {
            works = repository.findByStatusAndTitleContainingIgnoreCaseOrStatusAndDescriptionContainingIgnoreCase(WorkStatus.ACTIVE, normalizedQ, WorkStatus.ACTIVE, normalizedQ);
        } else if (hasCategory) {
            works = repository.findByStatusAndCategoryIgnoreCase(WorkStatus.ACTIVE, normalizedCategory);
        } else {
            works = repository.findByStatus(WorkStatus.ACTIVE);
        }

        if (hasQ && hasCategory) {
            works = works.stream().filter(work -> work.getCategory() != null).filter(work -> work.getCategory().equalsIgnoreCase(normalizedCategory)).toList();
        }

        if (minPrice != null) {
            works = works.stream().filter(work -> work.getPrice() != null).filter(work -> work.getPrice().compareTo(minPrice) >= 0).toList();
        }

        if (maxPrice != null) {
            works = works.stream().filter(work -> work.getPrice() != null).filter(work -> work.getPrice().compareTo(maxPrice) <= 0).toList();
        }

        if (ownerId != null) {
            works = works.stream().filter(work -> work.getOwner() != null).filter(work -> work.getOwner().getId().equals(ownerId)).toList();
        }

        return works.stream().map(WorkResponse::fromEntity).toList();
    }
}