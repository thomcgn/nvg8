package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungExtern;

import java.util.List;

public interface MeldungExternRepository extends JpaRepository<MeldungExtern, Long> {

    @Query("""
           select e from MeldungExtern e
           where e.meldung.id = :meldungId
           order by e.id asc
           """)
    List<MeldungExtern> findAllByMeldungId(Long meldungId);

    @Modifying
    @Query("""
           delete from MeldungExtern e
           where e.meldung.id = :meldungId
           """)
    void deleteAllByMeldungId(Long meldungId);
}