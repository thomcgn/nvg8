package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungAttachment;

import java.util.List;

public interface FalleroeffnungErstmeldungAttachmentRepository extends JpaRepository<FalleroeffnungErstmeldungAttachment, Long> {

    @Query("""
           select a
           from FalleroeffnungErstmeldungAttachment a
           where a.erstmeldung.id = :erstmeldungId
           order by a.createdAt asc
           """)
    List<FalleroeffnungErstmeldungAttachment> findAllByErstmeldungId(Long erstmeldungId);

    void deleteAllByErstmeldung_Id(Long erstmeldungId);
}