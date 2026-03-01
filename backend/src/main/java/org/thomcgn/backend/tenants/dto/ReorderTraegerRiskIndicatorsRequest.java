package org.thomcgn.backend.tenants.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderTraegerRiskIndicatorsRequest(
        @NotEmpty List<Long> orderedIds
) {}