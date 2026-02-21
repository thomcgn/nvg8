package org.thomcgn.backend.users.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Data
@MappedSuperclass
public abstract class Person extends AuditableEntity {

    private String vorname;
    private String nachname;

    // -----------------------------
    // Staatsangehörigkeit
    // -----------------------------
    @Column(length = 2)
    private String staatsangehoerigkeitIso2; // "DE", "AT", "CH", "TR" ...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StaatsangehoerigkeitSonderfall staatsangehoerigkeitSonderfall =
            StaatsangehoerigkeitSonderfall.KEINER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StaatsangehoerigkeitGruppe staatsangehoerigkeitGruppe =
            StaatsangehoerigkeitGruppe.UNBEKANNT;

    // -----------------------------
    // Aufenthaltsrecht / Titel
    // -----------------------------
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private AufenthaltstitelTyp aufenthaltstitelTyp;

    @Column(length = 200)
    private String aufenthaltstitelDetails;

    // -----------------------------
    // Sprache / Dolmetsch / CODA
    // -----------------------------
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "mutterspracheCode",
                    column = @Column(name = "kp_muttersprache_code", length = 15)),
            @AttributeOverride(name = "bevorzugteSpracheCode",
                    column = @Column(name = "kp_bevorzugte_sprache_code", length = 15)),
            @AttributeOverride(name = "dolmetschBedarf",
                    column = @Column(name = "kp_dolmetsch_bedarf", nullable = false, length = 50)),
            @AttributeOverride(name = "dolmetschSpracheCode",
                    column = @Column(name = "kp_dolmetsch_sprache_code", length = 15)),
            @AttributeOverride(name = "hoerStatus",
                    column = @Column(name = "kp_hoer_status", nullable = false, length = 50)),
            @AttributeOverride(name = "codaStatus",
                    column = @Column(name = "kp_coda_status", nullable = false, length = 50)),
            @AttributeOverride(name = "gebaerdenspracheCode",
                    column = @Column(name = "kp_gebaerdensprache_code", length = 20)),
            @AttributeOverride(name = "kommunikationsHinweise",
                    column = @Column(name = "kp_kommunikations_hinweise", length = 500))
    })
    private KommunikationsProfil kommunikationsProfil = new KommunikationsProfil();

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
     * Optional: Kontakt-Email (nicht Login). Für User bleibt Login-Email im User.
     */
    @Column(name = "kontakt_email")
    private String kontaktEmail;
}