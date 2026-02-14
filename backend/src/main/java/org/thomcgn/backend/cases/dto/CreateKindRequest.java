package org.thomcgn.backend.cases.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateKindRequest {

    // -----------------------------
    // Grunddaten
    // -----------------------------
    private String vorname;
    private String nachname;

    /**
     * ISO-Format: yyyy-MM-dd
     */
    private String geburtsdatum;

    // -----------------------------
    // Adresse
    // -----------------------------
    private String strasse;
    private String hausnummer;
    private String plz;
    private String ort;

    private String telefon;

    // -----------------------------
    // Kontakt (optional)
    // -----------------------------
    private String email;          // Legacy
    private String kontaktEmail;   // Neues Feld

    // -----------------------------
    // Staatsangehörigkeit
    // -----------------------------
    private String staatsangehoerigkeitIso2;
    private String staatsangehoerigkeitSonderfall;
    private String staatsangehoerigkeitGruppe;

    // -----------------------------
    // Aufenthaltsrecht
    // -----------------------------
    private String aufenthaltstitelTyp;
    private String aufenthaltstitelDetails;

    // -----------------------------
    // Sprache & Kommunikation
    // -----------------------------
    private String mutterspracheCode;
    private String bevorzugteSpracheCode;

    private String dolmetschBedarf;
    private String dolmetschSpracheCode;

    private String hoerStatus;
    private String codaStatus;

    private String gebaerdenspracheCode;
    private String kommunikationsHinweise;

    // -----------------------------
    // Legacy-Felder (werden intern gemappt)
    // -----------------------------
    private String hauptsprache;
    private Boolean brauchtDolmetsch;

    // -----------------------------
    // Bezugspersonen-Verknüpfung
    // -----------------------------
    private List<BezugspersonLink> bezugspersonen;

    @Data
    public static class BezugspersonLink {

        /**
         * ID der bestehenden Bezugsperson
         */
        private Long id;

        /**
         * Enum-Name: MUTTER, VATER, PFLEGEELTERNTEIL, SONSTIGE etc.
         */
        private String rolleImAlltag;
    }
}