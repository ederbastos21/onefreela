package br.unicesumar.onefreela.utils;

public class StringFunctions {
    private boolean hasUppercase(String value){
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

    private boolean hasNumber (String value){
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

    private boolean hasSpecialCharacter (String value){
        if (value == null){
            return false;
        }

        if (value.matches(".*[^a-zA-Z0-9].*")) {
            return true;
        }

        return false;
    }
}
