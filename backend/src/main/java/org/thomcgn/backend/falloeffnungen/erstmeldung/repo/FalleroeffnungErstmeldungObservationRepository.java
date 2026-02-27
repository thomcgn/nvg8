package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungObservation;

import java.util.List;

public interface FalleroeffnungErstmeldungObservationRepository extends JpaRepository<FalleroeffnungErstmeldungObservation, Long> {

    @Query("""
           select o
           from FalleroeffnungErstmeldungObservation o
           where o.erstmeldung.id = :erstmeldungId
           order by o.createdAt asc
           """)
    List<FalleroeffnungErstmeldungObservation> findAllByErstmeldungId(Long erstmeldungId);

    void deleteAllByErstmeldung_Id(Long erstmeldungId);
}