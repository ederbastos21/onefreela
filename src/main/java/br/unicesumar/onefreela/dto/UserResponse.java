package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.User;

import java.time.LocalDate;

public class UserResponse {

    private Long id;
    private Boolean isAdmin;
    private String name;
    private String email;
    private String cpf;
    private LocalDate birthday;
    private String phoneNumber;
    private String profilePicturePath;
    private String registerDate;
    private Boolean verified;

    public static UserResponse fromEntity(User user){
        UserResponse r = new UserResponse();
        r.id = user.getId();
        r.isAdmin = user.getAdmin();
        r.name = user.getName();
        r.email = user.getEmail();
        r.cpf = user.getCpf();
        r.birthday = user.getBirthday();
        r.phoneNumber = user.getPhoneNumber();
        r.profilePicturePath = user.getProfilePicturePath();
        r.registerDate = user.getRegisterDate();
        r.verified = user.getVerified();
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getAdmin() {
        return isAdmin;
    }

    public void setAdmin(Boolean admin) {
        isAdmin = admin;
    }

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

    public String getProfilePicturePath() {
        return profilePicturePath;
    }

    public void setProfilePicturePath(String profilePicturePath) {
        this.profilePicturePath = profilePicturePath;
    }

    public String getRegisterDate() {
        return registerDate;
    }

    public void setRegisterDate(String registerDate) {
        this.registerDate = registerDate;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public UserResponse() {}
}