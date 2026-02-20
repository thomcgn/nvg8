package org.thomcgn.backend.teams.dto;

import java.util.List;

public record UpdateTeamsRequest(List<Long> teamIds) {}

