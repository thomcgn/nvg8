package org.thomcgn.backend.falloeffnungen.erstmeldung.dto;

import org.thomcgn.backend.falloeffnungen.erstmeldung.model.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ErstmeldungDraftRequest(
        String erfasstVonRolle,
        Meldeweg meldeweg,
        String meldewegSonstiges,
        String meldendeStelleKontakt,
        Dringlichkeit dringlichkeit,
        Datenbasis datenbasis,
        Boolean einwilligungVorhanden,
        Boolean schweigepflichtentbindungVorhanden,

        String kurzbeschreibung,

        // optional schon im Draft
        AmpelStatus fachAmpel,
        String fachText,
        AbweichungZurAutoAmpel abweichungZurAuto,
        String abweichungsBegruendung,

        boolean akutGefahrImVerzug,
        String akutBegruendung,
        Boolean akutNotrufErforderlich,
        JaNeinUnklar akutKindSicherUntergebracht,

        Long verantwortlicheFachkraftUserId,
        LocalDate naechsteUeberpruefungAm,
        String zusammenfassung,

        List<String> anlassCodes,
        List<ObservationDraft> observations,
        JugendamtDraft jugendamt,
        List<ContactDraft> contacts,
        List<ExternDraft> extern,
        List<AttachmentDraft> attachments
) {
    public record ObservationDraft(
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
            List<ObservationTagDraft> tags
    ) {}

    public record ObservationTagDraft(
            String anlassCode,
            String indicatorId,
            Integer severity,
            String comment
    ) {}

    public record JugendamtDraft(
            JugendamtInformiert informiert,
            Instant kontaktAm,
            JugendamtKontaktart kontaktart,
            String aktenzeichen,
            String begruendung
    ) {}

    public record ContactDraft(
            KontaktMit kontaktMit,
            Instant kontaktAm,
            KontaktStatus status,
            String notiz,
            String ergebnis
    ) {}

    public record ExternDraft(
            ExterneStelle stelle,
            String stelleSonstiges,
            Instant am,
            String begruendung,
            String ergebnis
    ) {}

    public record AttachmentDraft(
            Long fileId,
            AttachmentTyp typ,
            String titel,
            String beschreibung,
            Sichtbarkeit sichtbarkeit,
            String rechtsgrundlageHinweis
    ) {}
}