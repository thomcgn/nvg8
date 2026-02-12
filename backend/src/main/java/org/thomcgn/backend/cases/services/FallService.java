package org.thomcgn.backend.cases.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.model.FallStatus;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.cases.repo.KinderschutzFallRepository;

@Service
public class FallService {

    private final KinderschutzFallRepository fallRepository;

    public FallService(KinderschutzFallRepository fallRepository) {
        this.fallRepository = fallRepository;
    }

    /**
     * Erstellt einen neuen Draft-Fall für ein Kind.
     * Jede neue Beobachtung wird dadurch zu einem neuen Datensatz.
     */
    @Transactional
    public KinderschutzFall createDraft(User user, Kind kind) {

        if (kind == null || kind.getId() == null) {
            throw new IllegalArgumentException("Kind muss vorhanden und persistiert sein.");
        }

        if (kind.getBezugspersonen() == null || kind.getBezugspersonen().isEmpty()) {
            throw new IllegalArgumentException("Jedes Kind muss mindestens eine Erziehungsperson/Bezugsperson haben.");
        }

        KinderschutzFall draft = new KinderschutzFall();

        // fachliche Zuordnung: meistens ist die erstellende Person die zuständige Fachkraft
        draft.setZustaendigeFachkraft(user);

        // optional: Teamleitung nur setzen, wenn es wirklich Teamleitung ist
        // draft.setTeamleitung(user);

        draft.setKind(kind);
        draft.setStatus(FallStatus.ENTWURF);

        // KEIN setCreatedAt(): AuditableEntity sollte das automatisch machen
        // KEIN draft.s#(true): hier musst du entscheiden, welches Feld du setzen willst

        return fallRepository.save(draft);
    }
}
