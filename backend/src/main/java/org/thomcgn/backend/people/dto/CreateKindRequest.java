package org.thomcgn.backend.people.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.thomcgn.backend.people.model.Gender;

import java.time.LocalDate;

public record CreateKindRequest(
        @NotBlank String vorname,
        @NotBlank String nachname,
        @NotNull LocalDate geburtsdatum,
        @NotNull Gender gender,

        boolean foerderbedarf,
        String foerderbedarfDetails,
        String gesundheitsHinweise,

        // ✅ Adresse (Pflicht)
        @NotBlank String strasse,
        @NotBlank String hausnummer,
        @NotBlank String plz,
        @NotBlank String ort,

        Long ownerEinrichtungOrgUnitId
) {
    @AssertTrue(message = "Geschlecht darf nicht UNBEKANNT sein")
    public boolean isGenderNotUnknown() {
        return gender != null && gender != Gender.UNBEKANNT;
    }

    @AssertTrue(message = "Förderbedarf-Details müssen angegeben werden, wenn Förderbedarf aktiv ist")
    public boolean isFoerderbedarfDetailsValid() {
        if (!foerderbedarf) return true;
        return foerderbedarfDetails != null && !foerderbedarfDetails.trim().isEmpty();
    }
}