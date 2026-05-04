package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UserRegisterDTO {

    @NotBlank(message = "nome não pode ser vazio")
    private String name;

    @NotBlank(message = "senha não pode ser vazia")
    private String password;

    @Email(message = "formato de email inválido")
    @NotBlank(message = "email não pode ser vazio")
    private String email;

    @NotBlank(message = "cpf não pode ser vazio")
    private String cpf;

    @NotNull(message = "data de nascimento não pode ser vazia")
    private LocalDate birthday;

    @NotBlank(message = "número de telefone não pode ser vazio")
    private String phoneNumber;

    // getters e setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    public void setBirthday(LocalDate birthday) {
        this.birthday = birthday;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
