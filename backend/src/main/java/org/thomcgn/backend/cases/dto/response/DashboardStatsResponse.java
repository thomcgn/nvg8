package org.thomcgn.backend.cases.dto.response;

public record DashboardStatsResponse(
        long meineOffenenFaelle,
        long akutGefaehrdet,
        long abgeschlossen30Tage
) {}