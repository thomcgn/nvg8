package org.thomcgn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.model.enums.AufenthaltstitelTyp;
import org.thomcgn.backend.model.enums.StaatsangehoerigkeitGruppe;
import org.thomcgn.backend.model.enums.StaatsangehoerigkeitSonderfall;

@Data
@MappedSuperclass
public abstract class Person {

    private String vorname;
    private String nachname;

    // -----------------------------
    // Staatsangehörigkeit
    // -----------------------------

    @Column(length = 2)
    private String staatsangehoerigkeitIso2; // "DE", "AT", "CH", "TR" ...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaatsangehoerigkeitSonderfall staatsangehoerigkeitSonderfall = StaatsangehoerigkeitSonderfall.KEINER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaatsangehoerigkeitGruppe staatsangehoerigkeitGruppe = StaatsangehoerigkeitGruppe.UNBEKANNT;

    // -----------------------------
    // Aufenthaltsrecht / Titel
    // -----------------------------
    @Enumerated(EnumType.STRING)
    private AufenthaltstitelTyp aufenthaltstitelTyp;

    @Column(length = 200)
    private String aufenthaltstitelDetails;

    // -----------------------------
    // Sprache / Dolmetsch / CODA
    // -----------------------------
    @Embedded
    private KommunikationsProfil kommunikationsProfil = new KommunikationsProfil();

    // -----------------------------
    // Adresse
    // -----------------------------
    private String strasse;
    private String hausnummer;
    private String plz;
    private String ort;

    // -----------------------------
    // Kontakt (für Kind evtl. leer, für Bezugsperson häufig, für User optional)
    // -----------------------------
    private String telefon;

    /**
     * Optional: Kontakt-Email (nicht Login). Für User bleibt Login-Email im User.
     */
    @Column(name = "kontakt_email")
    private String kontaktEmail;
}