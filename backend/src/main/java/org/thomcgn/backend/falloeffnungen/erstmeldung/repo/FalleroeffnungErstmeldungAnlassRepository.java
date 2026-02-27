package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungAnlass;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungAnlassId;

import java.util.List;

public interface FalleroeffnungErstmeldungAnlassRepository extends JpaRepository<FalleroeffnungErstmeldungAnlass, FalleroeffnungErstmeldungAnlassId> {

    @Query("""
           select a.code
           from FalleroeffnungErstmeldungAnlass a
           where a.erstmeldung.id = :erstmeldungId
           """)
    List<String> findCodes(Long erstmeldungId);

    void deleteAllByErstmeldung_Id(Long erstmeldungId);
}