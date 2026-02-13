package org.thomcgn.backend.kinderschutz.forms.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.kinderschutz.forms.api.dto.KSAutoSaveRequestDTO;
import org.thomcgn.backend.kinderschutz.forms.api.dto.KSAutoSaveResponseDTO;
import org.thomcgn.backend.kinderschutz.forms.service.KSFormService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/kinderschutz/forms")
public class KSFormController {

    private final KSFormService formService;

    @PostMapping("/autosave")
    public ResponseEntity<KSAutoSaveResponseDTO> autosave(@RequestBody KSAutoSaveRequestDTO req) {
        return ResponseEntity.ok(formService.autosave(req));
    }
}