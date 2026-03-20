package org.thomcgn.backend.people.model;

public enum BezugspersonBeziehung {
    MUTTER,
    VATER,
    SORGEBERECHTIGT,
    PFLEGEMUTTER,
    PFLEGEVATER,
    STIEFMUTTER,
    STIEFVATER,
    GROSSMUTTER,
    GROSSVATER,
    SONSTIGE;

    /**
     * Converts an arbitrary string to a {@link BezugspersonBeziehung}.
     * <p>
     * If the value is {@code null}, blank, or does not exactly match one of the
     * defined enum constants (case-sensitive), {@link #SONSTIGE} is returned.
     * This prevents unknown legacy/demo values (e.g. "TANTE") from causing
     * JPA mapping errors and keeps the database clean.
     * </p>
     * <p>
     * TODO: If more granularity is needed, consider adding a free-text field
     * {@code beziehungSonstigeBeschreibung} to store the original label (e.g. "Tante")
     * alongside SONSTIGE so it is not silently lost.
     * </p>
     *
     * @param value raw string value from external input or legacy data
     * @return the matching enum constant, or {@link #SONSTIGE} for any unknown value
     */
    public static BezugspersonBeziehung fromStringOrSonstige(String value) {
        if (value == null || value.isBlank()) {
            return SONSTIGE;
        }
        try {
            return valueOf(value.trim());
        } catch (IllegalArgumentException e) {
            return SONSTIGE;
        }
    }
}