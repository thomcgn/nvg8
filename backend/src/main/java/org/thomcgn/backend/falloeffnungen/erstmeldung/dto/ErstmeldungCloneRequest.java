package org.thomcgn.backend.falloeffnungen.erstmeldung.dto;

public record ErstmeldungCloneRequest(
        boolean includeAnlaesse,
        boolean includeObservations,
        boolean includeObservationTags,
        boolean includeJugendamt,
        boolean includeContacts,
        boolean includeExtern,
        boolean includeAttachments,
        boolean carryOverFachlicheEinschaetzung
) {
    public static ErstmeldungCloneRequest defaults() {
        return new ErstmeldungCloneRequest(
                true,  // includeAnlaesse
                true,  // includeObservations
                true,  // includeObservationTags
                false, // includeJugendamt (oft bewusst neu entscheiden)
                true,  // includeContacts
                true,  // includeExtern
                true,  // includeAttachments
                false  // carryOverFachlicheEinschaetzung (meist nein)
        );
    }
}