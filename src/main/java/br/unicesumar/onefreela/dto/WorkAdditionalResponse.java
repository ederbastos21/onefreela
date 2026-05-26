package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.WorkAdditional;
import java.math.BigDecimal;

public class WorkAdditionalResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;

    public static WorkAdditionalResponse fromEntity(WorkAdditional additional) {
        WorkAdditionalResponse response = new WorkAdditionalResponse();
        response.id = additional.getId();
        response.title = additional.getTitle();
        response.description = additional.getDescription();
        response.price = additional.getPrice();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public WorkAdditionalResponse() {}
}