package org.thomcgn.backend.falloeffnungen.erstmeldung.dto;

import org.thomcgn.backend.falloeffnungen.erstmeldung.model.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ErstmeldungResponse(
        Long id,
        Long fallId,
        int versionNo,
        boolean current,
        Long supersedesId,
        ErstmeldungStatus status,

        Instant erfasstAm,
        String erfasstVonDisplayName,
        String erfasstVonRolle,

        Meldeweg meldeweg,
        String meldewegSonstiges,
        String meldendeStelleKontakt,
        Dringlichkeit dringlichkeit,
        Datenbasis datenbasis,
        Boolean einwilligungVorhanden,
        Boolean schweigepflichtentbindungVorhanden,

        String kurzbeschreibung,

        AmpelStatus fachAmpel,
        String fachText,
        AbweichungZurAutoAmpel abweichungZurAuto,
        String abweichungsBegruendung,

        boolean akutGefahrImVerzug,
        String akutBegruendung,
        Boolean akutNotrufErforderlich,
        JaNeinUnklar akutKindSicherUntergebracht,

        Long autoRiskSnapshotId,

        Instant submittedAt,
        String submittedByDisplayName,

        Instant freigabeAm,
        String freigabeVonDisplayName,
        Long verantwortlicheFachkraftUserId,
        LocalDate naechsteUeberpruefungAm,
        String zusammenfassung,

        List<String> anlassCodes,
        JugendamtResponse jugendamt,
        List<ContactResponse> contacts,
        List<ExternResponse> extern,
        List<AttachmentResponse> attachments,
        List<ObservationResponse> observations
) {
    public record JugendamtResponse(
            JugendamtInformiert informiert,
            Instant kontaktAm,
            JugendamtKontaktart kontaktart,
            String aktenzeichen,
            String begruendung
    ) {}

    public record ContactResponse(
            Long id,
            KontaktMit kontaktMit,
            Instant kontaktAm,
            KontaktStatus status,
            String notiz,
            String ergebnis
    ) {}

    public record ExternResponse(
            Long id,
            ExterneStelle stelle,
            String stelleSonstiges,
            Instant am,
            String begruendung,
            String ergebnis
    ) {}

    public record AttachmentResponse(
            Long id,
            Long fileId,
            AttachmentTyp typ,
            String titel,
            String beschreibung,
            Sichtbarkeit sichtbarkeit,
            String rechtsgrundlageHinweis
    ) {}

    public record ObservationResponse(
            Long id,
            Instant zeitpunkt,
            ObservationZeitraum zeitraum,
            ObservationOrt ort,
            String ortSonstiges,
            ObservationQuelle quelle,
            String text,
            String woertlichesZitat,
            String koerperbefund,
            String verhaltenKind,
            String verhaltenBezug,
            Sichtbarkeit sichtbarkeit,
            Long linkedNotizId,
            List<ObservationTagResponse> tags
    ) {}

    public record ObservationTagResponse(
            Long id,
            String anlassCode,
            String indicatorId,
            Integer severity,
            String comment
    ) {}
}