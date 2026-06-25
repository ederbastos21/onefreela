package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Report;
import br.unicesumar.onefreela.enums.ReportNature;
import br.unicesumar.onefreela.enums.ReportStatus;
import java.time.LocalDateTime;
import java.util.List;

public class ReportResponse {

    private Long id;
    private ReportNature nature;
    private String title;
    private String description;
    private ReportStatus status;
    private Long reporterId;
    private String reporterName;
    private String adminNotes;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
    private List<ReportAttachmentResponse> attachments;
    private Long workId;
    private String workTitle;

    public static ReportResponse fromEntity(Report report) {
        ReportResponse response = new ReportResponse();
        response.id = report.getId();
        response.nature = report.getNature();
        response.title = report.getTitle();
        response.description = report.getDescription();
        response.status = report.getStatus();
        response.adminNotes = report.getAdminNotes();
        response.createdAt = report.getCreatedAt();
        response.updatedAt = report.getUpdatedAt();
        response.reviewedAt = report.getReviewedAt();

        if (report.getReporter() != null) {
            response.reporterId = report.getReporter().getId();
            response.reporterName = report.getReporter().getName();
        }

        if (report.getReviewedBy() != null) {
            response.reviewedById = report.getReviewedBy().getId();
            response.reviewedByName = report.getReviewedBy().getName();
        }

        if (report.getWork() != null) {
            response.workId = report.getWork().getId();
            response.workTitle = report.getWork().getTitle();
        }

        response.attachments = report.getAttachments().stream().map(ReportAttachmentResponse::fromEntity).toList();
        return response;
    }

    public Long getId() {
        return id;
    }

    public ReportNature getNature() {
        return nature;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public Long getReviewedById() {
        return reviewedById;
    }

    public String getReviewedByName() {
        return reviewedByName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public List<ReportAttachmentResponse> getAttachments() {
        return attachments;
    }

    public Long getWorkId() {
        return workId;
    }

    public String getWorkTitle() {
        return workTitle;
    }

    public ReportResponse() {}
}