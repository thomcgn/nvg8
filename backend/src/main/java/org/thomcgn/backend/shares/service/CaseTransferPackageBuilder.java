package org.thomcgn.backend.shares.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.NoteVisibility;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;

import java.time.Instant;
import java.util.*;

@Service
public class CaseTransferPackageBuilder {

    private final FalleroeffnungNotizRepository notizRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public CaseTransferPackageBuilder(FalleroeffnungNotizRepository notizRepo) {
        this.notizRepo = notizRepo;
    }

    public String buildPayloadJson(Falleroeffnung f, Instant notesFrom, Instant notesTo) {
        try {
            Map<String, Object> root = new LinkedHashMap<>();

            root.put("aktenzeichen", f.getAktenzeichen());
            root.put("titel", f.getTitel());
            root.put("status", f.getStatus().name());
            root.put("createdAt", f.getCreatedAt());
            root.put("openedAt", f.getOpenedAt());
            root.put("closedAt", f.getClosedAt());

            var kind = f.getDossier().getKind();
            Map<String, Object> kindNode = new LinkedHashMap<>();
            kindNode.put("id", kind.getId());
            kindNode.put("vorname", kind.getVorname());
            kindNode.put("nachname", kind.getNachname());
            kindNode.put("geburtsdatum", kind.getGeburtsdatum());
            kindNode.put("gender", kind.getGender() != null ? kind.getGender().name() : null);
            kindNode.put("foerderbedarf", kind.isFoerderbedarf());
            root.put("kind", kindNode);

            // Notizen: nur SHAREABLE und optional Zeitraumfilter
            List<Map<String, Object>> notes = new ArrayList<>();
            for (var n : notizRepo.findAllByFalleroeffnungIdOrderByCreatedAtAsc(f.getId())) {
                if (n.getVisibility() != NoteVisibility.SHAREABLE) continue;

                Instant created = n.getCreatedAt();
                if (notesFrom != null && created != null && created.isBefore(notesFrom)) continue;
                if (notesTo != null && created != null && created.isAfter(notesTo)) continue;

                Map<String, Object> nn = new LinkedHashMap<>();
                nn.put("id", n.getId());
                nn.put("typ", n.getTyp());
                nn.put("text", n.getText());
                nn.put("createdAt", n.getCreatedAt());
                nn.put("createdBy", n.getCreatedBy() != null ? n.getCreatedBy().getDisplayName() : null);
                notes.add(nn);
            }
            root.put("notizen", notes);

            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build share payload", e);
        }
    }
}