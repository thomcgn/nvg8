package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungExtern;

import java.util.List;

public interface FalleroeffnungErstmeldungExternRepository extends JpaRepository<FalleroeffnungErstmeldungExtern, Long> {

    @Query("""
           select e
           from FalleroeffnungErstmeldungExtern e
           where e.erstmeldung.id = :erstmeldungId
           order by e.createdAt asc
           """)
    List<FalleroeffnungErstmeldungExtern> findAllByErstmeldungId(Long erstmeldungId);

    void deleteAllByErstmeldung_Id(Long erstmeldungId);
}