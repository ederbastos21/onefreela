package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.ReportRegisterDTO;
import br.unicesumar.onefreela.dto.ReportResponse;
import br.unicesumar.onefreela.dto.ReportReviewDTO;
import br.unicesumar.onefreela.entity.Report;
import br.unicesumar.onefreela.entity.ReportAttachment;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.enums.ReportStatus;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.ReportRepository;
import br.unicesumar.onefreela.service.mapper.ReportMapper;
import br.unicesumar.onefreela.service.validator.ReportValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository repository;
    private final ReportValidator reportValidator;
    private final ReportMapper reportMapper;
    private final ReportFileStorageService reportFileStorageService;
    private final WorkService workService;

    public ReportService(ReportRepository repository, ReportValidator reportValidator, ReportMapper reportMapper, ReportFileStorageService reportFileStorageService, WorkService workService) {
        this.repository = repository;
        this.reportValidator = reportValidator;
        this.reportMapper = reportMapper;
        this.reportFileStorageService = reportFileStorageService;
        this.workService = workService;
    }

    @Transactional
    public ReportResponse registerReport(User reporter, ReportRegisterDTO reportRegisterDTO, List<MultipartFile> attachments) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(reportValidator.validateRegister(reportRegisterDTO, attachments));

        Work work = null;
        if (reportRegisterDTO.getWorkId() != null) {
            work = workService.findById(reportRegisterDTO.getWorkId());
            if (work == null) {
                errors.add(new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "workId", "Serviço não encontrado"));
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        Report report = reportMapper.toReport(reportRegisterDTO);
        report.setReporter(reporter);
        report.setWork(work);

        if (attachments != null) {
            for (MultipartFile file : attachments) {
                if (file != null && !file.isEmpty()) {
                    ReportAttachment attachment = reportFileStorageService.store(file);
                    report.addAttachment(attachment);
                }
            }
        }
        Report savedReport = repository.save(report);
        return ReportResponse.fromEntity(savedReport);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> findMyReports(User reporter) {
        List<Report> reports = repository.findByReporterId(reporter.getId());
        return reports.stream().map(ReportResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> findAllReports() {
        List<Report> reports = repository.findAll();
        return reports.stream().map(ReportResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> findByStatus(String status) {
        List<ErrorDetail> errors = new ArrayList<>();
        ReportStatus reportStatus = null;

        if (status == null || status.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_STATUS_REQUIRED, "status", "O status da denúncia é obrigatório"));
            throw new ValidationException(errors);
        }

        try {
            reportStatus = ReportStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_STATUS_INVALID, "status", "Status de denúncia inválido"));
            throw new ValidationException(errors);
        }

        List<Report> reports = repository.findByStatus(reportStatus);
        return reports.stream().map(ReportResponse::fromEntity).toList();
    }

    @Transactional
    public ReportResponse updateStatus(User admin, Long reportId, ReportReviewDTO reportReviewDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(reportValidator.validateReview(reportReviewDTO));

        Report report = repository.findById(reportId).orElse(null);

        if (report == null) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_NOT_FOUND, "report", "Denúncia não encontrada"));
            throw new ValidationException(errors);
        }

        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.REJECTED) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_ALREADY_CLOSED, "report", "Esta denúncia já foi encerrada e não pode ser alterada"));
            throw new ValidationException(errors);
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        ReportStatus status = ReportStatus.valueOf(reportReviewDTO.getStatus());
        report.setStatus(status);
        report.setAdminNotes(reportReviewDTO.getAdminNotes());
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        Report savedReport = repository.save(report);
        return ReportResponse.fromEntity(savedReport);
    }
}