package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.PlatformBalanceResponse;
import br.unicesumar.onefreela.dto.UserBalanceResponse;
import br.unicesumar.onefreela.dto.WithdrawResponse;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.BalanceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/balance")
public class BalanceController {

    private final AuthService authService;
    private final BalanceService balanceService;

    public BalanceController(AuthService authService, BalanceService balanceService) {
        this.authService = authService;
        this.balanceService = balanceService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserBalanceResponse> getMyBalance(HttpServletRequest request) {
        User user = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(UserBalanceResponse.fromEntity(balanceService.getUserBalance(user)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WithdrawResponse> withdraw(HttpServletRequest request) {
        User user = authService.getAuthenticatedUser(request);
        BigDecimal withdrawnAmount = balanceService.withdrawUser(user);
        return ResponseEntity.ok(new WithdrawResponse(withdrawnAmount, BigDecimal.ZERO));
    }

    @GetMapping("/platform")
    public ResponseEntity<PlatformBalanceResponse> getPlatformBalance(HttpServletRequest request) {
        User admin = authService.getAuthenticatedUser(request);
        authService.checkAdmin(request, admin);
        return ResponseEntity.ok(PlatformBalanceResponse.fromEntity(balanceService.getPlatformBalance()));
    }

    @PostMapping("/platform/withdraw")
    public ResponseEntity<WithdrawResponse> withdrawPlatformAvailable(HttpServletRequest request) {
        User admin = authService.getAuthenticatedUser(request);
        authService.checkAdmin(request, admin);
        BigDecimal withdrawnAmount = balanceService.withdrawPlatformAvailable(admin);
        return ResponseEntity.ok(new WithdrawResponse(withdrawnAmount, BigDecimal.ZERO));
    }
}
