package br.unicesumar.onefreela.specification;

import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkStatus;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public final class WorkSpecifications {

    private WorkSpecifications() {}

    public static Specification<Work> titleOrDescriptionContains (String q){
        if (q == null || q.isBlank()) return null;
        String pattern = "%" + q.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
        );
    }

    public static Specification<Work> hasCategory (String category){
        if (category == null || category.isBlank()) return null;
        return (root, query, cb) -> cb.equal(cb.lower(root.get("category")), category.toLowerCase());
    }

    public static Specification<Work> priceGreaterThanOrEqual (BigDecimal min){
        if (min == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), min);
    }

    public static Specification<Work> priceLessThanOrEqual (BigDecimal max){
        if (max == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), max);
    }

    public static Specification<Work> hasOwnerId (Long ownerId){
        if (ownerId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("owner").get("id"), ownerId);
    }

    public static Specification<Work> hasStatus (WorkStatus status){
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}