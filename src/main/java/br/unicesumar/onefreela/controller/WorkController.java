package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.service.WorkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/works")
public class WorkController {

    @Autowired
    private WorkService workService;

    @GetMapping("/search")
    public ResponseEntity<List<WorkResponse>> search(@RequestParam(required = false) String q, @RequestParam(required = false) String category, @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice, @RequestParam(required = false) Long ownerId) {
        List<WorkResponse> response = workService.search(q, category, minPrice, maxPrice, ownerId);
        return ResponseEntity.ok(response);
    }
}