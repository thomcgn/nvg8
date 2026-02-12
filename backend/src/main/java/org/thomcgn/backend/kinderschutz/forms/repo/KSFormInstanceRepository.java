package org.thomcgn.backend.kinderschutz.forms.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormInstance;

import java.util.Optional;

public interface KSFormInstanceRepository extends JpaRepository<KSFormInstance, Long> {
    Optional<KSFormInstance> findFirstByFall_IdAndInstrumentCodeAndInstrumentVersionOrderByCreatedAtDesc(
            Long fallId, String instrumentCode, String instrumentVersion
    );
}

