package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.ReportReviewDTO;
import br.unicesumar.onefreela.dto.WorkResponse;
import br.unicesumar.onefreela.dto.WorkReviewDTO;
import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.enums.WorkStatus;
import br.unicesumar.onefreela.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;
    private final UserService userService;
    private final WorkService workService;
    private final CartService cartService;
    private final OrderService orderService;
    private final ReportService reportService;

    public AdminController(AuthService authService, UserService userService, WorkService workService, CartService cartService, OrderService orderService, ReportService reportService) {
        this.authService = authService;
        this.userService = userService;
        this.workService = workService;
        this.cartService = cartService;
        this.orderService = orderService;
        this.reportService = reportService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> showUsers (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            List<User> users = userService.findAll();
            return ResponseEntity.ok().body(users);
        }
        return null;
    }

    @PostMapping("/removeUser/{id}")
    public ResponseEntity<?> removeUser (HttpServletRequest httpServletRequest, @PathVariable Long userId){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            userService.deleteById(userId);
            return ResponseEntity.ok().body("deletado com sucesso");
        }

        return null;
    }

    @PostMapping("/makeUserAdmin/{id}")
    public ResponseEntity<?> makeUserAdmin (HttpServletRequest httpServletRequest, @PathVariable Long userId){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            User savedUser = userService.makeAdmin(userId);
            return ResponseEntity.ok().body(savedUser);
        }
        return null;
    }

    @PostMapping("/removeUserAdmin/{id}")
    public ResponseEntity<?> removeUserAdmin (HttpServletRequest httpServletRequest, @PathVariable Long userId){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            User savedUser = userService.removeAdmin(userId);
            return ResponseEntity.ok().body(savedUser);
        }
        return null;
    }

    @GetMapping("/works")
    public ResponseEntity<?> showWorks (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if(authService.checkAdmin(httpServletRequest, user)){
            List<Work> works = workService.findAll();
            return ResponseEntity.ok().body(works);
        }
        return null;
    }

    @GetMapping("/works/pending")
    public ResponseEntity<?> showPendingWorks (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if(authService.checkAdmin(httpServletRequest, user)){
            List<Work> works = workService.findByStatus(WorkStatus.PENDING_REVIEW);
            return ResponseEntity.ok().body(works);
        }
        return null;
    }

    @PostMapping("/works/pauseWork/{id}")
    public ResponseEntity<?> pauseWork (HttpServletRequest httpServletRequest, @PathVariable Long workId){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if(authService.checkAdmin(httpServletRequest, user)){
            Work work = workService.findById(workId);
            work.setStatus(WorkStatus.INACTIVE);
            workService.save(work);
            return ResponseEntity.ok().body(work);
        }
        return null;
    }

    @PutMapping("works/reviewWork/{id}")
    public ResponseEntity<WorkResponse> reviewWork(HttpServletRequest httpServletRequest, @PathVariable Long id, @Valid @RequestBody WorkReviewDTO workReviewDTO) {
        User admin = authService.getAuthenticatedUser(httpServletRequest);
        authService.checkAdmin(httpServletRequest, admin);
        WorkResponse response = workService.reviewWork(admin, id, workReviewDTO);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/removeWork/{id}")
    public ResponseEntity<?> removeWork (HttpServletRequest httpServletRequest, @PathVariable Long workId){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if(authService.checkAdmin(httpServletRequest, user)){
            workService.deleteWork(user,workId);
            return ResponseEntity.ok().body("deletado com sucesso");
        }
        return null;
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports(HttpServletRequest request) {
        User admin = authService.getAuthenticatedUser(request);
        authService.checkAdmin(request, admin);
        return ResponseEntity.ok(reportService.findAllReports());
    }

    @GetMapping("/reports/byStatus")
    public ResponseEntity<?> getReportsByStatus(HttpServletRequest request, @RequestParam String status) {
        User admin = authService.getAuthenticatedUser(request);
        authService.checkAdmin(request, admin);
        return ResponseEntity.ok(reportService.findByStatus(status));
    }

    @PutMapping("/reports/{id}/review")
    public ResponseEntity<?> reviewReport(HttpServletRequest request, @PathVariable Long id, @Valid @RequestBody ReportReviewDTO reportReviewDTO) {
        User admin = authService.getAuthenticatedUser(request);
        authService.checkAdmin(request, admin);
        return ResponseEntity.ok(reportService.updateStatus(admin, id, reportReviewDTO));
    }
}
