package org.thomcgn.backend.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thomcgn.backend.admin.service.DemoResetService;

@RestController
@RequestMapping("/admin/demo")
public class DemoResetController {

    private final DemoResetService demoResetService;

    public DemoResetController(DemoResetService demoResetService) {
        this.demoResetService = demoResetService;
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> reset() {
        demoResetService.reset();
        return ResponseEntity.noContent().build();
    }
}
