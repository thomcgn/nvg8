package org.thomcgn.backend.kinderschutz.catalog.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.catalog.KSSection;

import java.util.List;

public interface KSSectionRepository extends JpaRepository<KSSection, Long> {
    List<KSSection> findByInstrument_CodeAndInstrument_VersionOrderByOrderIndexAsc(String code, String version);
}
