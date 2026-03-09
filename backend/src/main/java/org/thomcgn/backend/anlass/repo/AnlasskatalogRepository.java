package org.thomcgn.backend.anlass.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.anlass.model.AnlasskatalogEntry;

import java.util.List;
import java.util.Optional;

public interface AnlasskatalogRepository extends JpaRepository<AnlasskatalogEntry, Long> {

    List<AnlasskatalogEntry> findAllByOrderByCategoryAscLabelAsc();

    Optional<AnlasskatalogEntry> findByCode(String code);

    boolean existsByCode(String code);

    // Fuzzy label search: find entries where label ILIKE %term%
    @Query("select e from AnlasskatalogEntry e where lower(e.label) like lower(concat('%', :term, '%')) order by e.category, e.label")
    List<AnlasskatalogEntry> findSimilarByLabel(String term);

    // Also search by code fragment
    @Query("select e from AnlasskatalogEntry e where lower(e.code) like lower(concat('%', :term, '%')) or lower(e.label) like lower(concat('%', :term, '%')) order by e.category, e.label")
    List<AnlasskatalogEntry> searchByCodeOrLabel(String term);
}
