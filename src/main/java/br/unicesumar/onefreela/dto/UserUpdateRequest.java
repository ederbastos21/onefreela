package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UserUpdateRequest {

    @NotBlank(message = "nome não pode ser vazio")
    private String name;

    @NotBlank(message = "senha não pode ser vazio")
    private String password;

    @Email(message = "formato de email invalido")
    @NotBlank(message = "email não pode ser vazio")
    private String email;

    @NotNull(message = "data não pode ser vazio")
    private LocalDate birthday;

    @NotBlank(message = "numero de telefone não pode ser vazio")
    private String phoneNumber;

    private String profilePicturePath;

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

    public String getProfilePicturePath() {
        return profilePicturePath;
    }

    public void setProfilePicturePath(String profilePicturePath) {
        this.profilePicturePath = profilePicturePath;
    }

    public UserUpdateRequest() {}
}