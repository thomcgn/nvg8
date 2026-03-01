package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungObservationTag;

import java.util.List;

public interface MeldungObservationTagRepository extends JpaRepository<MeldungObservationTag, Long> {

    @Query("""
           select t from MeldungObservationTag t
           where t.observation.id in :observationIds
           """)
    List<MeldungObservationTag> findAllByObservationIds(List<Long> observationIds);

    @Modifying
    @Query("""
           delete from MeldungObservationTag t
           where t.observation.id in :observationIds
           """)
    void deleteAllByObservationIds(List<Long> observationIds);
}