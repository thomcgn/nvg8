package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungObservation;

import java.util.List;

public interface MeldungObservationRepository extends JpaRepository<MeldungObservation, Long> {

    @Query("""
           select o from MeldungObservation o
           where o.meldung.id = :meldungId
           order by o.id asc
           """)
    List<MeldungObservation> findAllByMeldungId(Long meldungId);

    @Modifying
    @Query("""
           delete from MeldungObservation o
           where o.meldung.id = :meldungId
           """)
    void deleteAllByMeldungId(Long meldungId);
}