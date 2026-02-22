package org.thomcgn.backend.s8a.controller;


import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.s8a.dto.CreateS8aForEpisodeRequest;
import org.thomcgn.backend.s8a.dto.S8aCaseListItemResponse;
import org.thomcgn.backend.s8a.dto.S8aCaseResponse;
import org.thomcgn.backend.s8a.service.S8aService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/s8a")
public class S8aEpisodeController {

    private final S8aService service;

    public S8aEpisodeController(S8aService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<S8aCaseResponse> create(@PathVariable("falloeffnungId") Long falleroeffnungId,
                                                  @Valid @RequestBody CreateS8aForEpisodeRequest req) {
        return ResponseEntity.ok(service.createForFalleroeffnung(falleroeffnungId, req));
    }

    @GetMapping
    public ResponseEntity<List<S8aCaseListItemResponse>> list(@PathVariable("falloeffnungId") Long falleroeffnungId) {
        return ResponseEntity.ok(service.listByFalleroeffnung(falleroeffnungId));
    }
}