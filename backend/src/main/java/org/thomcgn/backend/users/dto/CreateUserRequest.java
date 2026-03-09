package org.thomcgn.backend.users.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank String initialPassword,

        @NotBlank String vorname,
        @NotBlank String nachname,

        String staatsangehoerigkeitIso2,
        String staatsangehoerigkeitSonderfall,
        String staatsangehoerigkeitGruppe,

        String aufenthaltstitelTyp,
        String aufenthaltstitelDetails,

        @Valid KommunikationsProfilDto kommunikationsProfil,

        String strasse,
        String hausnummer,
        String plz,
        String ort,

        String telefon,
        @Email String kontaktEmail,

        @Valid MitarbeiterFaehigkeitenDto mitarbeiterFaehigkeiten,

        Long defaultOrgUnitId,

        @Valid List<AssignRoleRequest> roles
) {}