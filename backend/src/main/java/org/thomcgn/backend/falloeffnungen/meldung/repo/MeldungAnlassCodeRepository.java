package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungAnlassCode;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungAnlassCodeId;

import java.util.List;

public interface MeldungAnlassCodeRepository extends JpaRepository<MeldungAnlassCode, MeldungAnlassCodeId> {

    @Query("""
           select a from MeldungAnlassCode a
           where a.meldung.id = :meldungId
           """)
    List<MeldungAnlassCode> findAllByMeldungId(Long meldungId);

    @Modifying
    @Query("""
           delete from MeldungAnlassCode a
           where a.meldung.id = :meldungId
           """)
    void deleteAllByMeldungId(Long meldungId);
}