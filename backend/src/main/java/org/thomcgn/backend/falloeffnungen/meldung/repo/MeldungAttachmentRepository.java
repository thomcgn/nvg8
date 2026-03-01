package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungAttachment;

import java.util.List;

public interface MeldungAttachmentRepository extends JpaRepository<MeldungAttachment, Long> {

    @Query("""
           select a from MeldungAttachment a
           where a.meldung.id = :meldungId
           order by a.id asc
           """)
    List<MeldungAttachment> findAllByMeldungId(Long meldungId);

    @Modifying
    @Query("""
           delete from MeldungAttachment a
           where a.meldung.id = :meldungId
           """)
    void deleteAllByMeldungId(Long meldungId);
}