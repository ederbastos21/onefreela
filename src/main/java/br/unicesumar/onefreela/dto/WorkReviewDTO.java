package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.NotBlank;

public class WorkReviewDTO {

    @NotBlank(message = "status não pode ser vazio")
    private String status;

    private String adminNotes;

    public String getStatus() {
        return status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public WorkReviewDTO() {}
}