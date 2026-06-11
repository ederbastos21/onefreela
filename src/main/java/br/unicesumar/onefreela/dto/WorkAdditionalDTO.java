package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WorkAdditionalDTO {

    @NotBlank(message = "titulo do adicional não pode ser vazio")
    private String title;

    private String description;

    @NotNull(message = "preço do adicional não pode ser vazio")
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public WorkAdditionalDTO() {}
}