package org.thomcgn.backend.tenants.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.tenants.model.Traeger;

public interface TraegerRepository extends JpaRepository<Traeger, Long> {}