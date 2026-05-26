package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.WorkRepository;
import br.unicesumar.onefreela.service.mapper.WorkMapper;
import br.unicesumar.onefreela.service.validator.WorkValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
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
        return repository.findById(id).orElseThrow();
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
        work.setStatus(WorkStatus.ACTIVE);

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

    private boolean hasPendingRelations(Work work) {
        return false;
    }
}