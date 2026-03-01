package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungContact;

import java.util.List;

public interface MeldungContactRepository extends JpaRepository<MeldungContact, Long> {

    @Query("""
           select c from MeldungContact c
           where c.meldung.id = :meldungId
           order by c.id asc
           """)
    List<MeldungContact> findAllByMeldungId(Long meldungId);

    @Modifying
    @Query("""
           delete from MeldungContact c
           where c.meldung.id = :meldungId
           """)
    void deleteAllByMeldungId(Long meldungId);
}