package org.thomcgn.backend.falloeffnungen.dto;

import org.thomcgn.backend.falloeffnungen.risk.dto.RiskSnapshotResponse;

import java.util.List;

public record FalleroeffnungResponse(
        Long id,
        String aktenzeichen,
        String status,
        String titel,
        String kurzbeschreibung,
        Long traegerId,
        Long dossierId,
        Long kindId,
        String kindName,
        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String createdByDisplayName,
        List<String> anlassCodes,
        RiskSnapshotResponse latestRisk,
        List<FalleroeffnungNotizResponse> notizen
) {}