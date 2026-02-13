package org.thomcgn.backend.kinderschutz.forms.api.dto;

public record KSAutoSaveResponseDTO(
        Long instanceId,
        Long newVersion
) {}