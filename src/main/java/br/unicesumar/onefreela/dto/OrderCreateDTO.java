package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class OrderCreateDTO {

    @NotEmpty(message = "O pedido deve conter ao menos um serviço")
    private List<Long> workIds;

    public List<Long> getWorkIds() { return workIds; }
    public void setWorkIds(List<Long> workIds) { this.workIds = workIds; }
}
