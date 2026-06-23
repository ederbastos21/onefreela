package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import static br.unicesumar.onefreela.utils.StringFunctions.*;

@Component
public class UserValidator {
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

    private List<ErrorDetail> validateBaseUserData(String name, LocalDate birthday, String password, String phoneNumber, String email){
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(isValidName(name));
        errors.addAll(isValidBirthday(birthday));
        errors.addAll(isValidPassword(password));
        errors.addAll(isValidPhoneNumber(phoneNumber));
        errors.addAll(isValidEmailFormat(email));

        return errors;
    }

    public List<ErrorDetail> validateRegister(UserRegisterDTO userRegisterDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(validateBaseUserData(
                userRegisterDTO.getName(),
                userRegisterDTO.getBirthday(),
                userRegisterDTO.getPassword(),
                userRegisterDTO.getPhoneNumber(),
                userRegisterDTO.getEmail()
        ));

        errors.addAll(isValidCPF(userRegisterDTO.getCpf()));

        return errors;
    }

    public List<ErrorDetail> validateUpdate(UserUpdateDTO userUpdateDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        errors.addAll(validateBaseUserData(
                userUpdateDTO.getName(),
                userUpdateDTO.getBirthday(),
                userUpdateDTO.getNewPassword(),
                userUpdateDTO.getPhoneNumber(),
                userUpdateDTO.getOldEmail()
        ));
        return errors;
    }
}
