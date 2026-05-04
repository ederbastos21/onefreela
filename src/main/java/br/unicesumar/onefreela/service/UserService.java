package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.repository.UserRepository;
import org.springframework.stereotype.Service;
import br.unicesumar.onefreela.dto.UserUpdateRequest;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.regex.Pattern;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public List<User> findAll() {
        return repository.findAll();
    }
    
    public Optional<User> findById (Long id){
        return repository.findById(id);
    }

    public User save(User user) {
        return repository.save(user);
    }

    public User findByEmail(String email){
        return repository.findByEmail(email);
    }

    public Boolean existsByEmail (String email){
        return repository.existsByEmail(email);
    }

    private Boolean hasUppercase(String value){
        if (value == null){
            return false;
        }

        for (char c : value.toCharArray()){
            if (Character.isUpperCase(c)){
                return true;
            }
        }
        return false;
    }

    private Boolean hasNumber (String value){
        if (value == null){
            return false;
        }

        for (char c : value.toCharArray()){
            if (Character.isDigit(c)){
                return true;
            }
        }
        return false;
    }

    private Boolean hasSpecialCharacter (String value){
        if (value == null){
            return false;
        }

        if (value.matches(".*[^a-zA-Z0-9].*")) {
            return true;
        }

        return false;
    }

    private boolean isValidName(String value){

        if (hasNumber(value) || hasSpecialCharacter(value) || value.length()<2 || value.length()>100){
            return false;
        }
        return true;
    }

    private Boolean isValidEmailFormat (String email) {
        Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
        if (email == null) return false;
        return EMAIL_PATTERN.matcher(email).matches();
    }

    private Boolean isValidCPF(String cpf) {
        if (cpf == null) return false;

        cpf = cpf.replaceAll("\\D", "");

        if (cpf.length() != 11) {
            return false;
        }

        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        try {
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += (cpf.charAt(i) - '0') * (10 - i);
            }
            int firstDigit = 11 - (sum % 11);
            if (firstDigit >= 10) firstDigit = 0;

            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += (cpf.charAt(i) - '0') * (11 - i);
            }
            int secondDigit = 11 - (sum % 11);
            if (secondDigit >= 10) secondDigit = 0;

            return firstDigit == (cpf.charAt(9) - '0') && secondDigit == (cpf.charAt(10) - '0');

        } catch (Exception e) {
            return false;
        }
    }

    private Boolean isValidBirthday(LocalDate value){
        if (value == null){
            return false;
        }
        int age = Period.between(value,LocalDate.now()).getYears();
        if (age < 18 || age > 120){
            return false;
        }
        return true;
    }

    private Boolean isValidPhoneNumber(String value){
        if (value.length()!=13){
            return false;
        }

        for (Character c: value.toCharArray()){
            if (!Character.isDigit(c)){
                return false;
            }
        }

        return true;
    }

    private Boolean isValidPassword (String value){
        if (value == null){
            return false;
        }
        if (value.length()<8 || value.length()>100 || !hasNumber(value) || !hasUppercase(value) || !hasSpecialCharacter(value)){
            return false;
        }
        return true;
    }

    public Boolean isValidUserData(User user){

        String name = user.getName();
        String password = user.getPassword();
        String email = user.getEmail();
        String cpf = user.getCpf();
        LocalDate birthday = user.getBirthday();
        String phoneNumber = user.getPhoneNumber();

        if (!isValidName(name)){
            return false;
        }

        if (!isValidPassword(password)){
            return false;
        }

        if (repository.existsByEmail(email) || !isValidEmailFormat(email)){
            return false;
        }

        if (!isValidCPF(cpf)){
            return false;
        }

        if (!isValidBirthday(birthday)){
            return false;
        }

        if (!isValidPhoneNumber(phoneNumber)){
            return false;
        }

        return true;
    }
    
    public Boolean isValidUpdateData (UserUpdateRequest data, Long userId){
    
        String name = data.getName();
        String password = data.getPassword();
        String email = data.getEmail();
        LocalDate birthday = data.getBirthday();
        String phoneNumber = data.getPhoneNumber();
    
        if (!isValidName(name)){
            return false;
        }
    
        if (!isValidPassword(password)){
            return false;
        }
    
        if (repository.existsByEmailAndIdNot(email, userId) || !isValidEmailFormat(email)){
            return false;
        }
    
        if (!isValidBirthday(birthday)){
            return false;
        }
    
        if (!isValidPhoneNumber(phoneNumber)){
            return false;
        }
    
        return true;
    }
    
    public User applyUpdate (User existing, UserUpdateRequest data){
        existing.setName(data.getName());
        existing.setPassword(data.getPassword());
        existing.setEmail(data.getEmail());
        existing.setBirthday(data.getBirthday());
        existing.setPhoneNumber(data.getPhoneNumber());
        existing.setProfilePicturePath(data.getProfilePicturePath());
        return repository.save(existing);
    }
}
