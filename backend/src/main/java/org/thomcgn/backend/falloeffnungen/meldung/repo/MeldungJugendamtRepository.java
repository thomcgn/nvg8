package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungJugendamt;

import java.util.Optional;

public interface MeldungJugendamtRepository extends JpaRepository<MeldungJugendamt, Long> {

    @Query("""
           select j from MeldungJugendamt j
           where j.meldung.id = :meldungId
           """)
    Optional<MeldungJugendamt> findByMeldungId(Long meldungId);
}