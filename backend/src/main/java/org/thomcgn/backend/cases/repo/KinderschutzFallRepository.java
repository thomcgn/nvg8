package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.KinderschutzFall;

import java.util.List;

public interface KinderschutzFallRepository extends JpaRepository<KinderschutzFall, Long> {

    // Dashboard / mine
    List<KinderschutzFall> findForDashboardByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(String email);

    List<KinderschutzFall> findByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(String email);

    // ✅ systemweit alle Fälle
    List<KinderschutzFall> findAllByOrderByUpdatedAtDesc();
}
