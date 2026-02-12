package org.thomcgn.backend.kinderschutz.forms.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.kinderschutz.api.dto.*;
import org.thomcgn.backend.kinderschutz.forms.service.KSFormService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class KSFormController {

    private final KSFormService service;

    @GetMapping("/faelle/{fallId}/instrumente/{code}/{version}/schema")
    public KSInstrumentSchemaDTO schema(@PathVariable Long fallId, @PathVariable String code, @PathVariable String version) {
        // fallId aktuell nur für Routing/ACL – Schema kommt aus Katalog
        return service.loadSchema(code, version);
    }

    @PostMapping("/faelle/{fallId}/forms")
    public Long create(@PathVariable Long fallId, @RequestBody CreateKSFormDTO dto) {
        return service.createOrGetDraft(fallId, dto.instrumentCode(), dto.instrumentVersion());
    }

    @GetMapping("/forms/{instanceId}")
    public KSFormInstanceDTO load(@PathVariable Long instanceId) {
        return service.loadInstance(instanceId);
    }

    @PutMapping("/forms/{instanceId}")
    public void save(@PathVariable Long instanceId, @RequestBody SaveKSFormDTO dto) {
        service.save(instanceId, dto);
    }

    @PostMapping("/forms/{instanceId}/submit")
    public void submit(@PathVariable Long instanceId) {
        service.save(instanceId, new SaveKSFormDTO(org.thomcgn.backend.kinderschutz.forms.model.FormStatus.SUBMITTED, java.util.List.of()));
    }
}
