package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungChange;

import java.util.List;

public interface MeldungChangeRepository extends JpaRepository<MeldungChange, Long> {
    List<MeldungChange> findAllByMeldung_IdOrderByChangedAtAsc(Long meldungId);
}