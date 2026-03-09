package org.thomcgn.backend.anlass.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.anlass.dto.*;
import org.thomcgn.backend.anlass.service.AnlasskatalogService;

import java.util.List;

@RestController
@RequestMapping("/anlass-catalog")
@RequiredArgsConstructor
public class AnlasskatalogController {

    private final AnlasskatalogService service;

    /** List all catalog entries (any authenticated user) */
    @GetMapping
    public List<AnlasskatalogEntryResponse> list() {
        return service.listAll();
    }

    /** Check for similar entries before creating (any authenticated user) */
    @GetMapping("/similar")
    public AnlasskatalogSimilarResponse similar(
            @RequestParam(required = false) String label,
            @RequestParam(required = false) String code
    ) {
        return service.findSimilar(label, code);
    }

    /** Create a new catalog entry (TRAEGER_ADMIN) */
    @PostMapping
    public AnlasskatalogEntryResponse create(@RequestBody CreateAnlasskatalogEntryRequest req) {
        return service.create(req);
    }
}
