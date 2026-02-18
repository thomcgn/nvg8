package org.thomcgn.backend.cases.api.kws.dto;


import org.thomcgn.backend.cases.model.kws.KwsTriState;

public record DiffEntryDto(
        Long itemId,
        String itemKey,
        String label,
        KwsTriState beforeTriState,
        KwsTriState afterTriState
) {}