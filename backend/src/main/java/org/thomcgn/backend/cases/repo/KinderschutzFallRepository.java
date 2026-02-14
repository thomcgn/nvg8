package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.KinderschutzFall;

import java.util.List;

public interface KinderschutzFallRepository extends JpaRepository<KinderschutzFall, Long> {

    List<KinderschutzFall> findByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(String email);
}