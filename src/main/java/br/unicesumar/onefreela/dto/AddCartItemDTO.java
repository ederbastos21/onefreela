package br.unicesumar.onefreela.dto;

public class AddCartItemDTO {
    private Long WorkId;
    private int amount;

    public Long getWorkId() {
        return WorkId;
    }

    public void setWorkId(Long workId) {
        WorkId = workId;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }
}
