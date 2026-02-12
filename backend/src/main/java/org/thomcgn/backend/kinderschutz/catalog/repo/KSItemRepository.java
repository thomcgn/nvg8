package org.thomcgn.backend.kinderschutz.catalog.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

import java.util.List;

public interface KSItemRepository extends JpaRepository<KSItem, Long> {
    List<KSItem> findBySection_Instrument_CodeAndSection_Instrument_VersionOrderBySection_OrderIndexAscOrderIndexAsc(
            String code, String version
    );
}