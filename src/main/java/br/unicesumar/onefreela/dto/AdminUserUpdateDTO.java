package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AdminUserUpdateDTO {

    @NotBlank(message = "nome não pode ser vazio")
    private String name;

    @Email(message = "formato de email invalido")
    @NotBlank(message = "email não pode ser vazio")
    private String email;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public AdminUserUpdateDTO() {}
}
