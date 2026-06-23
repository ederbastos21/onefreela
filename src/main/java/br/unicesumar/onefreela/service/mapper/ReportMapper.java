package br.unicesumar.onefreela.service.mapper;

import br.unicesumar.onefreela.dto.ReportRegisterDTO;
import br.unicesumar.onefreela.entity.Report;
import br.unicesumar.onefreela.enums.ReportNature;
import br.unicesumar.onefreela.enums.ReportStatus;
import org.springframework.stereotype.Component;

@Component
public class ReportMapper {

    public Report toReport(ReportRegisterDTO dto) {
        Report report = new Report();
        report.setNature(ReportNature.valueOf(dto.getNature()));
        report.setTitle(dto.getTitle());
        report.setDescription(dto.getDescription());
        report.setStatus(ReportStatus.PENDING);
        return report;
    }
}