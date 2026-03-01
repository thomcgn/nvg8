package org.thomcgn.backend.dossiers.controller;

import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.dossiers.dto.AkteResponse;
import org.thomcgn.backend.dossiers.dto.CreateFallInAkteRequest;
import org.thomcgn.backend.dossiers.service.AkteService;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;

@RestController
@RequestMapping("/api")
public class AkteController {

    private final AkteService service;

    public AkteController(AkteService service) {
        this.service = service;
    }

    // ✅ Akte per Kind (autocreate)
    @GetMapping("/kinder/{kindId}/akte")
    public AkteResponse getOrCreateAkteByKind(@PathVariable Long kindId) {
        return service.getOrCreateAkteByKind(kindId);
    }

    // ✅ Akte laden
    @GetMapping("/akten/{akteId}")
    public AkteResponse getAkte(@PathVariable Long akteId) {
        return service.getAkte(akteId);
    }

    // ✅ Fall in Akte erstellen
    @PostMapping("/akten/{akteId}/faelle")
    public FalleroeffnungResponse createFallInAkte(
            @PathVariable Long akteId,
            @RequestBody(required = false) CreateFallInAkteRequest req
    ) {
        return service.createFallInAkte(akteId, req);
    }
}