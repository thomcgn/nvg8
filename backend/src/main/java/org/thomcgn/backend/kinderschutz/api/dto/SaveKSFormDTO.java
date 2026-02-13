package org.thomcgn.backend.kinderschutz.api.dto;

import org.thomcgn.backend.kinderschutz.forms.model.KSFormStatus;
import java.util.List;

public record SaveKSFormDTO(
        KSFormStatus status,
        List<KSAnswerDTO> answers
) {}