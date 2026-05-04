package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.WorkSearchCriteria;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.repository.WorkRepository;
import br.unicesumar.onefreela.specification.WorkSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WorkService {

    private final WorkRepository repository;

    public WorkService(WorkRepository repository) {
        this.repository = repository;
    }

    public Optional<Work> findById (Long id){
        return repository.findById(id);
    }

    public Page<Work> search (WorkSearchCriteria criteria, Pageable pageable){
        Specification<Work> spec = Specification
                .where(WorkSpecifications.titleOrDescriptionContains(criteria.getQ()))
                .and(WorkSpecifications.hasCategory(criteria.getCategory()))
                .and(WorkSpecifications.priceGreaterThanOrEqual(criteria.getMinPrice()))
                .and(WorkSpecifications.priceLessThanOrEqual(criteria.getMaxPrice()))
                .and(WorkSpecifications.hasOwnerId(criteria.getOwnerId()))
                .and(WorkSpecifications.hasStatus(criteria.getStatus()));

        return repository.findAll(spec, pageable);
    }
}
