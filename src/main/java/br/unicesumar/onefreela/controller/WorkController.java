package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.dto.WorkReviewDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.WorkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/works")
public class WorkController {

    @Autowired
    private WorkService workService;

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<WorkResponse> registerWork(HttpServletRequest httpServletRequest, @Valid @RequestBody WorkRegisterDTO workRegisterDTO) {
        User authenticatedUser = authService.checkFreelancer(httpServletRequest);
        WorkResponse response = workService.registerWork(authenticatedUser, workRegisterDTO);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/updateWork/{id}")
    public ResponseEntity<WorkResponse> updateWork(HttpServletRequest httpServletRequest, @PathVariable Long id, @Valid @RequestBody WorkUpdateDTO workUpdateDTO) {
        User authenticatedUser = authService.checkFreelancer(httpServletRequest);
        WorkResponse response = workService.updateWork(authenticatedUser, id, workUpdateDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/deleteWork/{id}")
    public ResponseEntity<?> deleteWork(HttpServletRequest httpServletRequest, @PathVariable Long id) {
        User authenticatedUser = authService.checkFreelancer(httpServletRequest);
        workService.deleteWork(authenticatedUser, id);
        return ResponseEntity.ok("Serviço excluído com sucesso");
    }

    @GetMapping("/myWorks")
    public ResponseEntity<List<WorkResponse>> findMyWorks(HttpServletRequest httpServletRequest) {
        User authenticatedUser = authService.checkFreelancer(httpServletRequest);
        List<WorkResponse> response = workService.findMyWorks(authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<WorkResponse>> search(@RequestParam(required = false) String q, @RequestParam(required = false) String category, @RequestParam(required = false) String minPrice, @RequestParam(required = false) String maxPrice, @RequestParam(required = false) String ownerId) {
        List<WorkResponse> response = workService.search(q, category, minPrice, maxPrice, ownerId);
        return ResponseEntity.ok(response);
    }
}