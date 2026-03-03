package org.thomcgn.backend.falloeffnungen.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import org.thomcgn.backend.falloeffnungen.model.DossierFallNoSeq;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface DossierFallNoSeqRepository extends JpaRepository<DossierFallNoSeq, Long> {

    // ✅ Row lock (SELECT ... FOR UPDATE)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DossierFallNoSeq> findByDossierId(Long dossierId);
}