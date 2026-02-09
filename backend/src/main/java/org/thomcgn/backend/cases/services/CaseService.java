package org.thomcgn.backend.cases.services;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.cases.model.CaseFile;
import org.thomcgn.backend.cases.model.CaseStatus;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.repo.CaseRepository;

import java.time.LocalDateTime;

@Service
public class CaseService {

    private final CaseRepository caseRepository;

    public CaseService(CaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    /**
     * Erstellt einen neuen Draft-Fall für ein Kind.
     * Jede neue Beobachtung wird dadurch zu einem neuen Datensatz.
     */
    public CaseFile createDraft(User user, Kind kind) {
        if (kind.getErziehungspersonen() == null || kind.getErziehungspersonen().isEmpty()) {
            throw new IllegalArgumentException("Jedes Kind muss mindestens eine Erziehungsperson haben.");
        }

        CaseFile draft = new CaseFile();
        draft.setCreatedBy(user);
        draft.setCreatedAt(LocalDateTime.now());
        draft.setDraft(true);
        draft.setKind(kind);
        draft.setStatus(CaseStatus.DRAFT);

        return caseRepository.save(draft);
    }
}
