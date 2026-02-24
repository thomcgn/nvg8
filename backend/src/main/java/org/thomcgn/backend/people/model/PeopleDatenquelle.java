package org.thomcgn.backend.people.model;

/**
 * Muss zu V1__schema.sql / kind_bezugsperson_relation_datenquelle_check passen.
 */
public enum PeopleDatenquelle {
    KIND,
    ELTERN,
    BEZUGSPERSON,
    SCHULE_KITA,
    JUGENDAMT,
    POLIZEI,
    ARZT,
    SONSTIGE
}