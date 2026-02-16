package org.thomcgn.backend.cases.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.cases.model.enums.FallStatus;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.cases.repo.KinderschutzFallRepository;

@Service
public class FallService {

    private final KinderschutzFallRepository fallRepository;

    @PersistenceContext
    private EntityManager em;

    public FallService(KinderschutzFallRepository fallRepository) {
        this.fallRepository = fallRepository;
    }

    @Transactional
    public KinderschutzFall createDraft(AuthPrincipal principal, Kind kind) {

        if (kind == null || kind.getId() == null) {
            throw new IllegalArgumentException("Kind muss vorhanden und persistiert sein.");
        }

        if (kind.getBezugspersonen() == null || kind.getBezugspersonen().isEmpty()) {
            throw new IllegalArgumentException("Jedes Kind muss mindestens eine Erziehungsperson/Bezugsperson haben.");
        }

        if (principal == null || principal.id() == null) {
            throw new IllegalArgumentException("User muss authentifiziert sein.");
        }

        KinderschutzFall draft = new KinderschutzFall();

        // ✅ DB-frei: FK setzen über getReference (keine SELECT users ...)
        User fachkraftRef = em.getReference(User.class, principal.id());
        draft.setZustaendigeFachkraft(fachkraftRef);

        draft.setKind(kind);
        draft.setStatus(FallStatus.ENTWURF);

        return fallRepository.save(draft);
    }
}