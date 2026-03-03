package org.thomcgn.backend.falloeffnungen.meldung.dto;

public record MeldungCorrectRequest(
        Long targetMeldungId // die alte Meldung, die korrigiert werden soll
) {}