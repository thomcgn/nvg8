package org.thomcgn.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import org.thomcgn.backend.model.enums.CodaStatus;
import org.thomcgn.backend.model.enums.DolmetschBedarf;
import org.thomcgn.backend.model.enums.HoerStatus;

@Data
@Embeddable
public class KommunikationsProfil {

    /**
     * BCP-47 Sprachcode: "de", "tr", "ar", "uk"...
     */
    @Column(length = 15)
    private String mutterspracheCode;

    /**
     * Sprache, in der die Einrichtung am besten kommuniziert.
     */
    @Column(length = 15)
    private String bevorzugteSpracheCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DolmetschBedarf dolmetschBedarf = DolmetschBedarf.UNGEKLAERT;

    /**
     * Wenn Sprachdolmetschen: welche Sprache? (BCP-47)
     */
    @Column(length = 15)
    private String dolmetschSpracheCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HoerStatus hoerStatus = HoerStatus.UNBEKANNT;

    /**
     * CODA = Child of Deaf Adults (Kind hörend, Eltern gehörlos) – als Flag,
     * weil’s im Hilfe-/Kommunikationskontext relevant sein kann.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CodaStatus codaStatus = CodaStatus.UNBEKANNT;

    /**
     * Optional: DGS/ÖGS/DSGS (oder dein internes Vokabular)
     */
    @Column(length = 20)
    private String gebaerdenspracheCode;

    /**
     * Freitext für Besonderheiten: "einfache Sprache", "schriftlich bevorzugt", etc.
     * (Wenn du später strukturieren willst, kann man das ausbauen.)
     */
    @Column(length = 500)
    private String kommunikationsHinweise;
}