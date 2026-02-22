package org.thomcgn.backend.dossiers.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.dossiers.model.KindDossier;

import java.util.Optional;

public interface KindDossierRepository extends JpaRepository<KindDossier, Long> {
    Optional<KindDossier> findByTraegerIdAndKindId(Long traegerId, Long kindId);
}