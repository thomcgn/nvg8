package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.KinderschutzFall;

import java.util.List;

public interface KinderschutzFallRepository extends JpaRepository<KinderschutzFall, Long> {

    /**
     * Dashboard "Meine Fälle":
     * Holt die Beziehungen, die das Mapping in {@code CaseMapper#toFall(...)} anfasst,
     * um N+1 Queries beim Serialisieren der Response zu verhindern.
     */
    @EntityGraph(attributePaths = {
            "kind",
            "zustaendigeFachkraft",
            "teamleitung",
            "gefaehrdungsbereiche"
    })
    List<KinderschutzFall> findForDashboardByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(String email);

    /**
     * Leichte Variante (ohne EntityGraph) – z.B. für Stats, die nur auf Feldern des Falls arbeiten.
     */
    List<KinderschutzFall> findByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(String email);
}