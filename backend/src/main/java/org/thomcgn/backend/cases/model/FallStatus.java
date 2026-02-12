package org.thomcgn.backend.cases.model;

public enum FallStatus {
    ENTWURF,           // noch nicht offiziell gestartet
    IN_PRUEFUNG,       // §8a-Einschätzung läuft
    AKUT,              // akute Gefährdung
    HILFEPLANUNG,      // Übergang in HzE
    ABGESCHLOSSEN,
    ARCHIVIERT
}
