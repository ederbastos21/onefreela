package br.unicesumar.onefreela.dto;

public class LoginResponseDTO {

    private String token;
    private long expiresAt;

    public LoginResponseDTO(String token, long expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public String getToken() { return token; }
    public long getExpiresAt() { return expiresAt; }
}
