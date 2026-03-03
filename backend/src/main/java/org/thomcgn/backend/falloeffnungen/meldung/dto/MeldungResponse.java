package org.thomcgn.backend.falloeffnungen.meldung.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MeldungResponse(
        Long id,
        Long fallId,
        int versionNo,
        boolean current,
        String status,
        String type,

        Instant createdAt,
        Instant updatedAt,
        String createdByDisplayName,

        Long supersedesId,
        Long correctsId,

        // Meta
        String erfasstVonRolle,
        String meldeweg,
        String meldewegSonstiges,
        String meldendeStelleKontakt,
        String dringlichkeit,
        String datenbasis,
        Boolean einwilligungVorhanden,
        Boolean schweigepflichtentbindungVorhanden,

        // Inhalt
        String kurzbeschreibung,

        // Fach
        String fachAmpel,
        String fachText,
        String abweichungZurAuto,
        String abweichungsBegruendung,

        // Akut
        boolean akutGefahrImVerzug,
        String akutBegruendung,
        Boolean akutNotrufErforderlich,
        String akutKindSicherUntergebracht,

        // Planung
        Long verantwortlicheFachkraftUserId,
        LocalDate naechsteUeberpruefungAm,
        String zusammenfassung,

        // Sections
        List<String> anlassCodes,
        JugendamtResponse jugendamt,
        List<ContactResponse> contacts,
        List<ExternResponse> extern,
        List<AttachmentResponse> attachments,

        // Observations
        List<ObservationResponse> observations,

        // Submit
        Instant submittedAt,
        String submittedByDisplayName,
        Instant freigabeAm,
        String freigabeVonDisplayName,

        // Changes
        List<MeldungChangeResponse> changes
) {
    public record ObservationResponse(
            Long id,
            Instant zeitpunkt,
            String zeitraum,
            String ort,
            String ortSonstiges,
            String quelle,
            String text,
            String woertlichesZitat,
            String koerperbefund,
            String verhaltenKind,
            String verhaltenBezug,
            String sichtbarkeit,
            Instant createdAt,
            String createdByDisplayName,
            List<ObservationTagResponse> tags
    ) {}

    public record ObservationTagResponse(
            Long id,
            String anlassCode,
            String indicatorId,
            Integer severity,
            String comment
    ) {}

    public record JugendamtResponse(
            String informiert,
            Instant kontaktAm,
            String kontaktart,
            String aktenzeichen,
            String begruendung
    ) {}

    public record ContactResponse(
            Long id,
            String kontaktMit,
            Instant kontaktAm,
            String status,
            String notiz,
            String ergebnis
    ) {}

    public record ExternResponse(
            Long id,
            String stelle,
            String stelleSonstiges,
            Instant am,
            String begruendung,
            String ergebnis
    ) {}

    public record AttachmentResponse(
            Long id,
            Long fileId,
            String typ,
            String titel,
            String beschreibung,
            String sichtbarkeit,
            String rechtsgrundlageHinweis
    ) {}
}