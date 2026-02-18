package org.thomcgn.backend.cases.repo.kws;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.kws.KwsTemplateSection;

import java.util.List;

public interface KwsTemplateSectionRepo extends JpaRepository<KwsTemplateSection, Long> {
    List<KwsTemplateSection> findByTemplateIdOrderBySortAsc(Long templateId);
}
