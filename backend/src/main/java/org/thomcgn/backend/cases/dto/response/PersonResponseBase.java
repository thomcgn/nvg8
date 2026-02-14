package org.thomcgn.backend.cases.dto.response;

public record PersonResponseBase(
        String vorname,
        String nachname,

        String staatsangehoerigkeitIso2,
        String staatsangehoerigkeitSonderfall,
        String staatsangehoerigkeitGruppe,

        String aufenthaltstitelTyp,
        String aufenthaltstitelDetails,

        KommunikationsProfilResponse kommunikationsProfil,

        String strasse,
        String hausnummer,
        String plz,
        String ort,

        String telefon,
        String kontaktEmail
) {}