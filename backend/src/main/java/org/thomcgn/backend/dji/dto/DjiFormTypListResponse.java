package org.thomcgn.backend.dji.dto;

import java.util.List;

public record DjiFormTypListResponse(List<FormTypItem> formTypen) {

    public record FormTypItem(String code, String label, String beschreibung) {}
}
