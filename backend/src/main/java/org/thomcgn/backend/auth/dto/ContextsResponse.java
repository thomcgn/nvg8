package org.thomcgn.backend.auth.dto;

import java.util.List;

public record ContextsResponse(List<AvailableContextDto> contexts) {}