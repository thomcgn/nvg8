package org.thomcgn.backend.shares.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.model.FallNotiz;
import org.thomcgn.backend.faelle.repo.FallNotizRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class CaseTransferPackageBuilder {

    private final FallNotizRepository notizRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CaseTransferPackageBuilder(FallNotizRepository notizRepository) {
        this.notizRepository = notizRepository;
    }

    public String buildPayloadJson(Fall fall, Instant notesFrom, Instant notesTo) {
        List<FallNotiz> all = notizRepository.findAllByFallId(fall.getId());

        List<Map<String, Object>> notes = all.stream()
                .filter(n -> inRange(n.getCreatedAt(), notesFrom, notesTo))
                .map(n -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", n.getId());
                    m.put("typ", n.getTyp());
                    m.put("text", n.getText());
                    m.put("createdAt", n.getCreatedAt());
                    m.put("createdBy", n.getCreatedBy().getDisplayName());
                    return m;
                })
                .toList();

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("fallId", fall.getId());
        root.put("status", fall.getStatus().name());
        root.put("titel", fall.getTitel());
        root.put("kurzbeschreibung", fall.getKurzbeschreibung());
        root.put("einrichtungOrgUnitId", fall.getEinrichtungOrgUnit().getId());
        root.put("teamOrgUnitId", fall.getTeamOrgUnit() != null ? fall.getTeamOrgUnit().getId() : null);
        root.put("createdAt", fall.getCreatedAt());
        root.put("notes", notes);

        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot serialize transfer payload", e);
        }
    }

    private boolean inRange(Instant t, Instant from, Instant to) {
        if (t == null) return false;
        if (from != null && t.isBefore(from)) return false;
        return to == null || !t.isAfter(to);
    }
}