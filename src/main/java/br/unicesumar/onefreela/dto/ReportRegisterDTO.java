package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReportRegisterDTO {

    @NotNull(message = "natureza da denúncia não pode ser vazia")
    private String nature;

    @NotBlank(message = "título não pode ser vazio")
    private String title;

    @NotBlank(message = "descrição não pode ser vazia")
    private String description;

    public String getNature() {
        return nature;
    }

    public void setNature(String nature) {
        this.nature = nature;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ReportRegisterDTO() {}
}