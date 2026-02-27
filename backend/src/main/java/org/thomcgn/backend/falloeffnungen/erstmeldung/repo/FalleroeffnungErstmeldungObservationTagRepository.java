package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungObservationTag;

import java.util.List;

public interface FalleroeffnungErstmeldungObservationTagRepository extends JpaRepository<FalleroeffnungErstmeldungObservationTag, Long> {

    @Query("""
           select t
           from FalleroeffnungErstmeldungObservationTag t
           where t.observation.id = :observationId
           order by t.createdAt asc
           """)
    List<FalleroeffnungErstmeldungObservationTag> findAllByObservationId(Long observationId);

    void deleteAllByObservation_Erstmeldung_Id(Long erstmeldungId);
}