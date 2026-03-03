package org.thomcgn.backend.dossiers.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.dossiers.dto.*;
import org.thomcgn.backend.dossiers.service.KindDossierService;

@RestController
public class AktenController {

    private final KindDossierService service;

    public AktenController(KindDossierService service) {
        this.service = service;
    }

    // --------- Akten ---------

    @GetMapping("/akten")
    public AkteListResponse listAkten(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return service.list(q, page, size);
    }

    @GetMapping("/akten/{akteId}")
    public AkteDto getAkte(@PathVariable Long akteId) {
        return service.getAkte(akteId);
    }

    @GetMapping("/akten/by-kind/{kindId}")
    public AkteDto getAkteByKind(@PathVariable Long kindId) {
        return service.getAkteByKind(kindId);
    }

    @PostMapping("/akten")
    public AkteDto createAkte(@RequestBody @Valid CreateAkteRequest req) {
        return service.createAkte(req);
    }

    // --------- Kind → Akte (recommended) ---------

    @GetMapping("/kinder/{kindId}/akte")
    public AkteDto resolveAkte(@PathVariable Long kindId) {
        return service.resolveOrCreateAkteForKind(kindId);
    }

    // --------- Fälle scoped to Akte ---------

    @GetMapping("/akten/{akteId}/faelle")
    public FallListResponse listFaelle(
            @PathVariable Long akteId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size
    ) {
        return service.listFaelle(akteId, page, size);
    }

    @PostMapping("/akten/{akteId}/faelle")
    public CreateFallInAkteResponse createFall(
            @PathVariable Long akteId,
            @RequestBody @Valid CreateFallInAkteRequest req
    ) {
        return service.createFall(akteId, req);
    }
}