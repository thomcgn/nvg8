package org.thomcgn.backend.kinderschutz.api.dto;

import org.thomcgn.backend.kinderschutz.forms.model.FormStatus;
import java.util.List;

public record SaveKSFormDTO(
        FormStatus status,
        List<KSAnswerDTO> answers
) {}