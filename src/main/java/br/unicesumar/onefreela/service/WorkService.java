package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.dto.WorkReviewDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.enums.WorkStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.WorkRepository;
import br.unicesumar.onefreela.service.mapper.WorkMapper;
import br.unicesumar.onefreela.service.validator.WorkValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkService {

    private final WorkRepository repository;
    private final WorkValidator workValidator;
    private final WorkMapper workMapper;

    public WorkService(WorkRepository repository, WorkValidator workValidator, WorkMapper workMapper) {
        this.repository = repository;
        this.workValidator = workValidator;
        this.workMapper = workMapper;
    }

    public Work findById(Long id){
        return repository.findById(id).orElse(null);
    }

    public List<Work> findAll(){
        return repository.findAll();
    }

    @Transactional
    public WorkResponse registerWork(User authenticatedUser, WorkRegisterDTO workRegisterDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(workValidator.validateRegister(workRegisterDTO));

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        Work work = workMapper.toWork(workRegisterDTO);
        work.setOwner(authenticatedUser);
        work.setStatus(WorkStatus.PENDING_REVIEW);
        work.setAdminNotes(null);
        work.setReviewedBy(null);
        work.setReviewedAt(null);

        Work savedWork = repository.save(work);
        return WorkResponse.fromEntity(savedWork);
    }

    @Transactional
    public WorkResponse updateWork(User authenticatedUser, Long workId, WorkUpdateDTO workUpdateDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(workValidator.validateUpdate(workUpdateDTO));
        Work work = repository.findById(workId).orElse(null);

        if (work == null) {
            errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "work", "Serviço não encontrado"));
            throw new ValidationException(errors);
        }

        if (work.getOwner() == null || !work.getOwner().getId().equals(authenticatedUser.getId())) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "work", "voce nao tem permissao para editar este serviço"));
            throw new ValidationException(errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        workMapper.updateWork(work, workUpdateDTO);
        work.setStatus(WorkStatus.PENDING_REVIEW);
        work.setAdminNotes(null);
        work.setReviewedBy(null);
        work.setReviewedAt(null);

        Work savedWork = repository.save(work);
        return WorkResponse.fromEntity(savedWork);
    }

    @Transactional
    public void deleteWork(User authenticatedUser, Long workId) {
        List<ErrorDetail> errors = new ArrayList<>();
        Work work = repository.findById(workId).orElse(null);

        if (work == null) {
            errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "work", "Serviço não encontrado"));
            throw new ValidationException(errors);
        }

        if (work.getOwner() == null || !work.getOwner().getId().equals(authenticatedUser.getId())) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "work", "voce nao tem permissao para excluir este serviço"));
            throw new ValidationException(errors);
        }

        if (hasPendingRelations(work)) {
            errors.add(new ErrorDetail(ErrorCode.WORK_CANNOT_BE_DELETED, "work", "Este serviço possui pendências e não pode ser excluído no momento"));
            throw new ValidationException(errors);
        }
        repository.delete(work);
    }

    @Transactional(readOnly = true)
    public List<WorkResponse> findMyWorks(User authenticatedUser) {
        List<Work> works = repository.findByOwnerId(authenticatedUser.getId());
        return works.stream().map(WorkResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<WorkResponse> findByStatusForAdmin(String status) {
        List<ErrorDetail> errors = new ArrayList<>();
        WorkStatus workStatus = null;

        if (status == null || status.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.WORK_REVIEW_STATUS_REQUIRED, "status", "O status é obrigatório"));
            throw new ValidationException(errors);
        }

        try {
            workStatus = WorkStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            errors.add(new ErrorDetail(ErrorCode.WORK_REVIEW_STATUS_INVALID, "status", "Status de serviço inválido"));
            throw new ValidationException(errors);
        }

        List<Work> works = repository.findByStatus(workStatus);
        return works.stream().map(WorkResponse::fromEntity).toList();
    }

    @Transactional
    public WorkResponse reviewWork(User admin, Long workId, WorkReviewDTO workReviewDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(workValidator.validateReview(workReviewDTO));
        Work work = repository.findById(workId).orElse(null);

        if (work == null) {
            errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "work", "Serviço não encontrado"));
            throw new ValidationException(errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        WorkStatus status = WorkStatus.valueOf(workReviewDTO.getStatus());

        work.setStatus(status);
        work.setAdminNotes(workReviewDTO.getAdminNotes());
        work.setReviewedBy(admin);
        work.setReviewedAt(LocalDateTime.now());

        Work savedWork = repository.save(work);
        return WorkResponse.fromEntity(savedWork);
    }

    @Transactional(readOnly = true)
    public List<WorkResponse> search(String q, String category, String minPrice, String maxPrice, String ownerId) {
        List<ErrorDetail> errors = workValidator.validateSearch(q, category, minPrice, maxPrice, ownerId);

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        BigDecimal parsedMinPrice = minPrice != null && !minPrice.isBlank() ? new BigDecimal(minPrice) : null;
        BigDecimal parsedMaxPrice = maxPrice != null && !maxPrice.isBlank() ? new BigDecimal(maxPrice) : null;
        Long parsedOwnerId = ownerId != null && !ownerId.isBlank() ? Long.parseLong(ownerId) : null;

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

        if (parsedMinPrice != null) {
            works = works.stream().filter(work -> work.getPrice() != null).filter(work -> work.getPrice().compareTo(parsedMinPrice) >= 0).toList();
        }

        if (parsedMaxPrice != null) {
            works = works.stream().filter(work -> work.getPrice() != null).filter(work -> work.getPrice().compareTo(parsedMaxPrice) <= 0).toList();
        }

        if (parsedOwnerId != null) {
            works = works.stream().filter(work -> work.getOwner() != null).filter(work -> work.getOwner().getId().equals(parsedOwnerId)).toList();
        }
        return works.stream().map(WorkResponse::fromEntity).toList();
    }

    private boolean hasPendingRelations(Work work) {
        return false;
    }
}