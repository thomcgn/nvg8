package org.thomcgn.backend.s8a.controller;

import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.service.S8aAssessmentService;

import java.util.List;

@RestController
@RequestMapping("/api/s8a/cases/{s8aCaseId}/assessment")
public class S8aAssessmentController {

    private final S8aAssessmentService service;

    public S8aAssessmentController(S8aAssessmentService service) {
        this.service = service;
    }

    /**
     * Aktuelle (neueste) Version.
     */
    @GetMapping
    public S8aAssessmentResponse getLatest(@PathVariable Long s8aCaseId) {
        return service.getLatest(s8aCaseId);
    }

    /**
     * Alle Versionen (Metadaten) absteigend nach Version.
     */
    @GetMapping("/versions")
    public List<S8aAssessmentVersionItemResponse> listVersions(@PathVariable Long s8aCaseId) {
        return service.listVersions(s8aCaseId);
    }

    /**
     * Konkrete Version.
     */
    @GetMapping("/versions/{version}")
    public S8aAssessmentResponse getVersion(@PathVariable Long s8aCaseId, @PathVariable int version) {
        return service.getVersion(s8aCaseId, version);
    }

    /**
     * Speichert eine neue Version der Einschätzung.
     */
    @PostMapping
    public S8aAssessmentResponse saveNewVersion(@PathVariable Long s8aCaseId,
                                                @RequestBody SaveS8aAssessmentRequest req) {
        return service.saveNewVersion(s8aCaseId, req);
    }
}