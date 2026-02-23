package org.thomcgn.backend.auth.dto;

import jakarta.validation.constraints.NotNull;

public record SwitchContextRequest(
        @NotNull Long einrichtungOrgUnitId
) {}