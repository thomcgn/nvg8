package org.thomcgn.backend.kinderschutz.forms.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.kinderschutz.api.dto.KSFormInstanceDTO;
import org.thomcgn.backend.kinderschutz.api.dto.SaveAnswersRequest;
import org.thomcgn.backend.kinderschutz.api.dto.SaveAnswersResponse;
import org.thomcgn.backend.kinderschutz.forms.exceptions.KSVersionConflictException;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswer;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormInstance;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRepository;
import org.thomcgn.backend.kinderschutz.forms.service.KSFormService;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ks/forms")
public class KSFormController {

    private final KSFormService formService;
    private final KSFormAnswerRepository answerRepo;

    public record CreateFormRequest(Long fallId, Long instrumentId) {}

    @PostMapping
    public KSFormInstanceDTO getOrCreate(@RequestBody CreateFormRequest req) {
        KSFormInstance inst = formService.getOrCreate(req.fallId(), req.instrumentId());
        var answers = answerRepo.findByInstanceId(inst.getId()).stream()
                .collect(Collectors.toMap(a -> a.getItem().getItemNo(), KSFormAnswer::getValue, (a, b)->b));
        return new KSFormInstanceDTO(inst.getId(), inst.getInstrument().getId(), inst.getFall().getId(),
                inst.getVersion(), inst.getStatus().name(), answers);
    }

    @PutMapping("/{instanceId}/answers")
    public ResponseEntity<?> saveAnswers(@PathVariable Long instanceId, @RequestBody SaveAnswersRequest req) {
        try {
            long newVersion = formService.saveAnswers(instanceId, req.expectedVersion(), req.answersByItemNo());
            return ResponseEntity.ok(new SaveAnswersResponse(instanceId, newVersion));
        } catch (KSVersionConflictException ex) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", "Version conflict",
                    "currentVersion", ex.getCurrentVersion()
            ));
        }
    }
}
