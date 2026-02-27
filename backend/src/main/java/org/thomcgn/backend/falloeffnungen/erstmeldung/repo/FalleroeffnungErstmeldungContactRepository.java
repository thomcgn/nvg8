package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldungContact;

import java.util.List;

public interface FalleroeffnungErstmeldungContactRepository extends JpaRepository<FalleroeffnungErstmeldungContact, Long> {

    @Query("""
           select c
           from FalleroeffnungErstmeldungContact c
           where c.erstmeldung.id = :erstmeldungId
           order by c.createdAt asc
           """)
    List<FalleroeffnungErstmeldungContact> findAllByErstmeldungId(Long erstmeldungId);

    void deleteAllByErstmeldung_Id(Long erstmeldungId);
}