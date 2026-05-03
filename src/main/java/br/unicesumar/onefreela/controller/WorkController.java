package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.dto.WorkSearchCriteria;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.service.WorkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/works")
public class WorkController {

    @Autowired
    private WorkService workService;

    @GetMapping("/search")
    public ResponseEntity<Page<WorkResponse>> search (
            WorkSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ){
        Page<Work> results = workService.search(criteria, pageable);
        Page<WorkResponse> response = results.map(WorkResponse::fromEntity);
        return ResponseEntity.ok(response);
    }
}