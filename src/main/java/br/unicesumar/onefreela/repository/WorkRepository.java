package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkRepository extends JpaRepository<Work, Long> {
    List<Work> findByStatus(WorkStatus status);

    List<Work> findByOwnerId(Long ownerId);

    List<Work> findByStatusAndCategoryIgnoreCase(WorkStatus status, String category);

    List<Work> findByStatusAndTitleContainingIgnoreCaseOrStatusAndDescriptionContainingIgnoreCase(WorkStatus statusForTitle, String title, WorkStatus statusForDescription, String description);
}