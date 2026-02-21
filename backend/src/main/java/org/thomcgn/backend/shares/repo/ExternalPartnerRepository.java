package org.thomcgn.backend.shares.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.shares.model.ExternalPartner;

public interface ExternalPartnerRepository extends JpaRepository<ExternalPartner, Long> {}