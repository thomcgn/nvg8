package org.thomcgn.backend.dossiers.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.dossiers.dto.*;
import org.thomcgn.backend.dossiers.service.AkteService;
import org.thomcgn.backend.dossiers.service.KindDossierService;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;

@RestController
@RequestMapping("/api") // <- Empfehlung: bleibt drin
public class AktenController {

    private final KindDossierService dossierService;
    private final AkteService akteService;

    public AktenController(KindDossierService dossierService, AkteService akteService) {
        this.dossierService = dossierService;
        this.akteService = akteService;
    }

    // --------- Akten ---------

    @GetMapping("/akten")
    public AkteListResponse listAkten(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return dossierService.list(q, page, size);
    }

    // ✅ Akte laden (einheitlich -> AkteResponse)
    @GetMapping("/akten/{akteId}")
    public AkteResponse getAkte(@PathVariable Long akteId) {
        return akteService.getAkte(akteId);
    }

    // --------- Kind → Akte ---------

    // ✅ exists (kein autocreate)
    @GetMapping("/kinder/{kindId}/akte/exists")
    public AkteResponse getAkteByKindIfExists(@PathVariable Long kindId) {
        return akteService.getAkteByKindIfExists(kindId); // wirft 404 wenn nicht vorhanden
    }

    // ✅ resolve (autocreate)
    @GetMapping("/kinder/{kindId}/akte")
    public AkteResponse resolveAkte(@PathVariable Long kindId) {
        return akteService.getOrCreateAkteByKind(kindId);
    }

    // --------- Fälle scoped to Akte ---------

    @PostMapping("/akten/{akteId}/faelle")
    public FalleroeffnungResponse createFallInAkte(
            @PathVariable Long akteId,
            @RequestBody(required = false) CreateFallInAkteRequest req
    ) {
        return akteService.createFallInAkte(akteId, req);
    }

    // OPTIONAL: falls dein FE es braucht (du hattest es im anderen Service)
    @GetMapping("/akten/{akteId}/faelle")
    public FallListResponse listFaelle(
            @PathVariable Long akteId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size
    ) {
        return dossierService.listFaelle(akteId, page, size);
    }

    // OPTIONAL: falls create akte via POST gebraucht wird
    @PostMapping("/akten")
    public AkteDto createAkte(@RequestBody @Valid CreateAkteRequest req) {
        return dossierService.createAkte(req);
    }

    // OPTIONAL: falls by-kind Endpoint gebraucht wird (würde ich eher entfernen)
    @GetMapping("/akten/by-kind/{kindId}")
    public AkteDto getAkteByKind(@PathVariable Long kindId) {
        return dossierService.getAkteByKind(kindId);
    }
}