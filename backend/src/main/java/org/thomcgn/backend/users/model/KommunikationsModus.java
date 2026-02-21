package org.thomcgn.backend.users.model;

public enum KommunikationsModus {
    LAUTSPRACHE,
    EINFACHE_SPRACHE,
    SCHRIFTLICH,
    LIPPENLESEN_UNTERSTUETZEN,

    GEBAERDENSPRACHE,          // DGS / ÖGS / DSGS je nach Land
    TAKTILE_GEBAERDEN,
    SCHRIFTDOLMETSCHEN,        // z.B. Live-Transkription
    ASSISTIVE_TECH             // z.B. FM-Anlage, App, etc.
}