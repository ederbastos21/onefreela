package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class WorkRegisterDTO {

    @NotBlank(message = "titulo não pode ser vazio")
    private String title;

    @NotBlank(message = "descrição não pode ser vazia")
    private String description;

    @NotBlank(message = "categoria não pode ser vazia")
    private String category;

    @NotNull(message = "preço não pode ser vazio")
    private BigDecimal price;

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public WorkRegisterDTO() {}

    private List<WorkAdditionalDTO> additionals;

    public List<WorkAdditionalDTO> getAdditionals() {
        return additionals;
    }
    
    public void setAdditionals(List<WorkAdditionalDTO> additionals) {
        this.additionals = additionals;
    }
}