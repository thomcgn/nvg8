package org.thomcgn.backend.dji.catalog;

import org.thomcgn.backend.dji.model.DjiFormTyp;

/**
 * Ein einzelnes Kriterium / eine Domäne innerhalb eines DJI-Prüfbogens.
 *
 * Achtung: Bestehende position_codes dürfen nicht umbenannt werden (Datenkontinuität).
 */
public record DjiItem(
        String code,
        String label,
        DjiFormTyp formTyp,
        String bereich,
        DjiBewertungstyp bewertungstyp
) {}
