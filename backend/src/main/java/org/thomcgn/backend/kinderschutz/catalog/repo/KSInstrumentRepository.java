package org.thomcgn.backend.kinderschutz.catalog.repo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.catalog.KSInstrument;

import java.util.Optional;

public interface KSInstrumentRepository extends JpaRepository<KSInstrument, Long> {

    @EntityGraph(attributePaths = {
            "sections",
            "sections.items"
    })
    Optional<KSInstrument> findByCodeAndVersion(String code, String version);
}
