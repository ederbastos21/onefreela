package br.unicesumar.onefreela.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UserUpdateDTO {

    @NotBlank(message = "nome não pode ser vazio")
    private String name;

    @NotBlank(message = "senha não pode ser vazio")
    private String oldPassword;

    @NotBlank(message = "senha não pode ser vazio")
    private String newPassword;

    @Email(message = "formato de email invalido")
    @NotBlank(message = "email não pode ser vazio")
    private String oldEmail;

    @Email(message = "formato de email invalido")
    @NotBlank(message = "email não pode ser vazio")
    private String newEmail;

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

    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getOldEmail() {
        return oldEmail;
    }

    public void setOldEmail(String oldEmail) {
        this.oldEmail = oldEmail;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
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

    public UserUpdateDTO() {}
}