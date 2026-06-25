package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Report;
import br.unicesumar.onefreela.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReporterId(Long reporterId);
    List<Report> findByStatus(ReportStatus status);
    boolean existsByWorkId(Long workId);
}