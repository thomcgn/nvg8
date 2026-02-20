package org.thomcgn.backend.orgunits.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.orgunits.model.OrgUnit;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, Long> {}