package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.ReportRegisterDTO;
import br.unicesumar.onefreela.dto.ReportResponse;
import br.unicesumar.onefreela.dto.ReportReviewDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private AuthService authService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> registerReport(HttpServletRequest httpServletRequest, @Valid @RequestPart("report") ReportRegisterDTO reportRegisterDTO, @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {
        User authenticatedUser = authService.getAuthenticatedUser(httpServletRequest);
        ReportResponse response = reportService.registerReport(authenticatedUser, reportRegisterDTO, attachments);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/myReports")
    public ResponseEntity<List<ReportResponse>> findMyReports(HttpServletRequest httpServletRequest) {
        User authenticatedUser = authService.getAuthenticatedUser(httpServletRequest);
        List<ReportResponse> response = reportService.findMyReports(authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<ReportResponse>> findAllReports(HttpServletRequest httpServletRequest) {
        User admin = authService.getAuthenticatedUser(httpServletRequest);
        authService.checkAdmin(httpServletRequest, admin);
        List<ReportResponse> response = reportService.findAllReports();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/status")
    public ResponseEntity<List<ReportResponse>> findByStatus(HttpServletRequest httpServletRequest, @RequestParam String status) {
        User admin = authService.getAuthenticatedUser(httpServletRequest);
        authService.checkAdmin(httpServletRequest, admin);
        List<ReportResponse> response = reportService.findByStatus(status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/admin/updateStatus/{id}")
    public ResponseEntity<ReportResponse> updateStatus(HttpServletRequest httpServletRequest, @PathVariable Long id, @Valid @RequestBody ReportReviewDTO reportReviewDTO) {
        User admin = authService.getAuthenticatedUser(httpServletRequest);
        authService.checkAdmin(httpServletRequest, admin);
        ReportResponse response = reportService.updateStatus(admin, id, reportReviewDTO);
        return ResponseEntity.ok(response);
    }
}