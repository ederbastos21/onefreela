package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.LoginRequest;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.UserRepository;
import br.unicesumar.onefreela.utils.StringFunctions;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import static br.unicesumar.onefreela.utils.StringFunctions.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,SessionService sessionService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
    }

    public List<User> findAll() {
        return repository.findAll();
    }

    public User save(UserRegisterDTO dto) {

        User user = new User();

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setCpf(dto.getCpf());
        user.setBirthday(dto.getBirthday());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setPassword(dto.getPassword());
        user.setVerified(false);
        user.setAdmin(false);

        return repository.save(user);
    }

    public User findByEmail(String email){
        return repository.findByEmail(email);
    }

    public Boolean existsByEmail (String email){
        return repository.existsByEmail(email);
    }

    private List<ErrorDetail> isValidName(String value){
        List<ErrorDetail> errors = new ArrayList<>();

        if (value == null || value.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.NAME_REQUIRED, "name", "O nome é obrigatório"));
            return errors;
        }

        if (hasNumber(value)) {
            errors.add(new ErrorDetail(ErrorCode.NAME_HAS_NUMBER, "name", "O nome não pode conter números"));
        }

        if (hasSpecialCharacter(value)) {
            errors.add(new ErrorDetail(ErrorCode.NAME_HAS_SPECIAL_CHAR, "name", "O nome não pode conter caracteres especiais"));
        }

        if (value.length() < 2) {
            errors.add(new ErrorDetail(ErrorCode.NAME_TOO_SHORT, "name", "O nome deve ter pelo menos 2 caracteres"));
        }

        if (value.length() > 100) {
            errors.add(new ErrorDetail(ErrorCode.NAME_TOO_LONG, "name", "O nome deve ter no máximo 100 caracteres"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidEmailFormat(String email) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (email == null || email.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_REQUIRED, "email", "O e-mail é obrigatório"));
            return errors;
        }

        Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_INVALID, "email", "Informe um e-mail válido (ex: nome@dominio.com)"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidCPF(String cpf) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (cpf == null || cpf.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.CPF_REQUIRED, "cpf", "O CPF é obrigatório"));
            return errors;
        }

        cpf = cpf.replace(".", "").replace("-", "");

        if (cpf.length() > 11) {
            errors.add(new ErrorDetail(ErrorCode.CPF_TOO_LONG, "cpf", "O CPF deve conter 11 dígitos"));
            return errors;
        }

        if (cpf.length() < 11) {
            errors.add(new ErrorDetail(ErrorCode.CPF_TOO_SHORT, "cpf", "O CPF deve conter 11 dígitos"));
            return errors;
        }

        for (Character c : cpf.toCharArray()){
            if (!Character.isDigit(c)){
                errors.add(new ErrorDetail(ErrorCode.CPF_HAS_LETTER, "cpf", "O cpf nao pode conter letras"));
                return errors;
            }
        }

        if (cpf.matches("(\\d)\\1{10}")) {
            errors.add(new ErrorDetail(ErrorCode.CPF_INVALID, "cpf", "O CPF informado não é válido"));
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

            int digit1 = cpf.charAt(9) - '0';
            int digit2 = cpf.charAt(10) - '0';

            if (firstDigit != digit1 || secondDigit != digit2) {
                errors.add(new ErrorDetail(ErrorCode.CPF_INVALID, "cpf", "O CPF informado não é válido"));
            }

        } catch (Exception e) {
            errors.add(new ErrorDetail(ErrorCode.CPF_INVALID, "cpf", "Erro ao validar o CPF"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidBirthday(LocalDate value){
        List<ErrorDetail> errors = new ArrayList<>();

        if (value == null){
            errors.add(new ErrorDetail(ErrorCode.BIRTHDAY_REQUIRED, "birthday", "A data de nascimento é obrigatória"));
            return errors;
        }

        int age = Period.between(value, LocalDate.now()).getYears();

        if (age < 18){
            errors.add(new ErrorDetail(ErrorCode.BIRTHDAY_TOO_RECENT, "birthday", "Você deve ter pelo menos 18 anos"));
        }

        if (age > 120){
            errors.add(new ErrorDetail(ErrorCode.BIRTHDAY_TOO_OLD, "birthday", "Data de nascimento inválida"));
        }

        return errors;
    }

    private List<ErrorDetail> isValidPhoneNumber(String value){
        List<ErrorDetail> errors = new ArrayList<>();

        if (value == null || value.isBlank()){
            errors.add(new ErrorDetail(ErrorCode.PHONE_NUMBER_REQUIRED, "phoneNumber", "O telefone é obrigatório"));
            return errors;
        }

        if (value.length() > 13){
            errors.add(new ErrorDetail(ErrorCode.PHONE_NUMBER_TOO_LONG, "phoneNumber", "O telefone é muito longo"));
        }

        if (value.length() < 10){
            errors.add(new ErrorDetail(ErrorCode.PHONE_NUMBER_TOO_SHORT, "phoneNumber", "O telefone é muito curto"));
        }

        for (Character c : value.toCharArray()){
            if (!Character.isDigit(c)){
                errors.add(new ErrorDetail(ErrorCode.PHONE_NUMBER_HAS_LETTER, "phoneNumber", "O telefone deve conter apenas números"));
                break;
            }
        }

        return errors;
    }

    private List<ErrorDetail> isValidPassword(String value){
        List<ErrorDetail> errors = new ArrayList<>();

        if (value == null || value.isBlank()){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_REQUIRED, "password", "A senha é obrigatória"));
            return errors;
        }

        if (value.length() < 8){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_TOO_SHORT, "password", "A senha deve ter pelo menos 8 caracteres"));
        }

        if (value.length() > 100){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_TOO_LONG, "password", "A senha não pode ter mais de 100 caracteres"));
        }

        if (!hasNumber(value)){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_LACK_NUMBER, "password", "A senha deve conter pelo menos um número"));
        }

        if (!hasSpecialCharacter(value)){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_LACK_SPECIAL_CHAR, "password", "A senha deve conter pelo menos um caractere especial"));
        }

        if (!hasUppercase(value)){
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_LACK_UPPERCASE, "password", "A senha deve conter pelo menos uma letra maiúscula"));
        }

        return errors;
    }

    public void createUser (UserRegisterDTO user){
        String name = user.getName();
        String password = user.getPassword();
        String email = user.getEmail();
        LocalDate birthday = user.getBirthday();
        String cpf = user.getCpf();
        String phoneNumber = user.getPhoneNumber();

        List <ErrorDetail> errors = new ArrayList<>();

        errors.addAll(isValidName(name));
        errors.addAll(isValidBirthday(birthday));
        errors.addAll(isValidPassword(password));
        errors.addAll(isValidCPF(cpf));
        errors.addAll(isValidPhoneNumber(phoneNumber));
        errors.addAll(isValidEmailFormat(email));

        if (errors.isEmpty()){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            save(user);
        } else {
            throw new ValidationException(errors);
        }
    }

    public void checkLoginCredentials (LoginRequest request){
        List<ErrorDetail> errors = new ArrayList<>();

        if (sessionService.getSession(request.getToken())!= null){
            System.out.println("deu certo login pelo token");
            return;
        }

        if (existsByEmail(request.getEmail())){
            User user = findByEmail(request.getEmail());

            if (passwordEncoder.matches(request.getPassword(), user.getPassword())){
                sessionService.storeSession(user.getId());
                return;
            }
            errors.add(new ErrorDetail(ErrorCode.VALIDATION_ERROR, "login", "Usuario ou senha incorretos"));
            throw new ValidationException(errors);
        }
        errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email nao existe no sistema"));
    }
}
