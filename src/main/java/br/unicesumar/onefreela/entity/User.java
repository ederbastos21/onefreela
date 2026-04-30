package br.unicesumar.onefreela.entity;

import jakarta.persistence.*;

import java.util.Date;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean isAdmin;
    private String name;
    private String password;
    private String email;
    private String phoneNumber;
    private String profilePicturePath;
    private Date registerDate;
    private Boolean verified;

    public User() {}
}
