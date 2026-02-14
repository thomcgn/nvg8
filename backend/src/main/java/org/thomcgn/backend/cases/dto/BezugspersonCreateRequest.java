package org.thomcgn.backend.cases.dto;

import lombok.Data;

@Data
public class BezugspersonCreateRequest {

    // -----------------------------
    // Grunddaten
    // -----------------------------
    private String vorname;
    private String nachname;

    // -----------------------------
    // Adresse
    // -----------------------------
    private String strasse;
    private String hausnummer;
    private String plz;
    private String ort;

    // -----------------------------
    // Kontakt
    // -----------------------------
    private String telefon;

    /**
     * Legacy-Feld (wird intern auf kontaktEmail gemappt)
     */
    private String email;

    /**
     * Neue saubere Kontakt-E-Mail
     */
    private String kontaktEmail;

    // -----------------------------
    // Staatsangehörigkeit
    // -----------------------------
    /**
     * ISO 3166-1 alpha-2 (z.B. "DE", "TR", "SY")
     */
    private String staatsangehoerigkeitIso2;

    /**
     * Enum-Name: KEINER, UNGEKLAERT, UNBEKANNT, STAATENLOS
     */
    private String staatsangehoerigkeitSonderfall;

    /**
     * Enum-Name: DE, EU_EWR, SCHWEIZ, DRITTSTAAT, UNBEKANNT
     */
    private String staatsangehoerigkeitGruppe;

    // -----------------------------
    // Aufenthaltsrecht
    // -----------------------------
    /**
     * Enum-Name z.B.:
     * AUFENTHALTSERLAUBNIS, DULDUNG, DEUTSCH, EU_EWR_FREIZUEGIGKEIT ...
     */
    private String aufenthaltstitelTyp;

    /**
     * Freitext z.B. "§ 25 Abs. 2 AufenthG"
     */
    private String aufenthaltstitelDetails;

    // -----------------------------
    // Sprache & Kommunikation
    // -----------------------------
    /**
     * BCP-47 Sprachcode (z.B. "de", "tr", "ar")
     */
    private String mutterspracheCode;

    /**
     * Sprache für Einrichtungskommunikation
     */
    private String bevorzugteSpracheCode;

    /**
     * Enum-Name:
     * KEIN, SPRACHDOLMETSCHEN, GEBAERDENSPRACHDOLMETSCHEN,
     * SCHRIFTDOLMETSCHEN, UNGEKLAERT
     */
    private String dolmetschBedarf;

    /**
     * Falls Sprachdolmetschen: welche Sprache?
     */
    private String dolmetschSpracheCode;

    /**
     * Enum-Name:
     * UNBEKANNT, HOEREND, SCHWERHOERIG, GEHOERLOS
     */
    private String hoerStatus;

    /**
     * Enum-Name:
     * UNBEKANNT, NEIN, JA
     */
    private String codaStatus;

    /**
     * z.B. "DGS", "ÖGS", "DSGS"
     */
    private String gebaerdenspracheCode;

    /**
     * Freitext für Besonderheiten
     */
    private String kommunikationsHinweise;
}