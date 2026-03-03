package org.thomcgn.backend.dossiers.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.dossiers.dto.AkteListResponse;
import org.thomcgn.backend.dossiers.dto.AkteResponse;
import org.thomcgn.backend.dossiers.dto.CreateAkteRequest;
import org.thomcgn.backend.dossiers.dto.CreateFallInAkteRequest;
import org.thomcgn.backend.dossiers.dto.FallListResponse;
import org.thomcgn.backend.dossiers.service.AkteService;
import org.thomcgn.backend.dossiers.service.KindDossierService;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;

@RestController
@RequestMapping("/api")
public class AktenController {

    private final KindDossierService dossierService;
    private final AkteService akteService;

    public AktenController(KindDossierService dossierService, AkteService akteService) {
        this.dossierService = dossierService;
        this.akteService = akteService;
    }

    // --------- Akten ---------

    // Liste bleibt bei dossierService (List DTO ist ok)
    @GetMapping("/akten")
    public AkteListResponse listAkten(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return dossierService.list(q, page, size);
    }

    // ✅ Akte-Detail IMMER als AkteResponse (ein Shape)
    @GetMapping("/akten/{akteId}")
    public AkteResponse getAkte(@PathVariable Long akteId) {
        return akteService.getAkte(akteId);
    }

    // --------- Kind → Akte ---------

    // ✅ exists (kein autocreate) -> 200 oder 404
    @GetMapping("/kinder/{kindId}/akte/exists")
    public AkteResponse getAkteByKindIfExists(@PathVariable Long kindId) {
        return akteService.getAkteByKindIfExists(kindId);
    }

    // ✅ resolve (autocreate)
    @GetMapping("/kinder/{kindId}/akte")
    public AkteResponse resolveAkte(@PathVariable Long kindId) {
        return akteService.getOrCreateAkteByKind(kindId);
    }

    // --------- Fälle scoped to Akte ---------

    @GetMapping("/akten/{akteId}/faelle")
    public FallListResponse listFaelle(
            @PathVariable Long akteId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size
    ) {
        return dossierService.listFaelle(akteId, page, size);
    }

    @PostMapping("/akten/{akteId}/faelle")
    public FalleroeffnungResponse createFallInAkte(
            @PathVariable Long akteId,
            @RequestBody(required = false) CreateFallInAkteRequest req
    ) {
        return akteService.createFallInAkte(akteId, req);
    }

    // --------- Optional: create akte ---------
    // Ich würde es behalten (ist praktisch), aber als AkteResponse wäre konsistenter.
    // Wenn du es brauchst, mappe intern auf resolve/create und gib AkteResponse zurück.
    @PostMapping("/akten")
    public AkteResponse createAkte(@RequestBody @Valid CreateAkteRequest req) {
        // "create" ist letztlich resolve-or-create für das Kind
        return akteService.getOrCreateAkteByKind(req.kindId());
    }

    // ❌ Optional entfernen: by-kind über /akten/by-kind/{kindId}
    // Macht doppelte API und andere DTO Shapes.
}