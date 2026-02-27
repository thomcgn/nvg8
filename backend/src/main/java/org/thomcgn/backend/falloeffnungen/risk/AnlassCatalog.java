package org.thomcgn.backend.falloeffnungen.risk;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public final class AnlassCatalog {

    private AnlassCatalog() {}

    // Vollständige Anlass-Liste als stabile Codes (Backend-Whitelist).
    // Diese Codes entsprechen dem React-Katalog (ANLASS_CATALOG).
    private static final Set<String> CODES = new HashSet<>(Set.of(
            // 1) Körperbezogene Anlässe
            "BODY_INJURY_VISIBLE",
            "BODY_INJURY_REPEATED",
            "BODY_INJURY_EXPLANATION_ODD",
            "BODY_PUNISHMENT_HINT",
            "BODY_MALNUTRITION",
            "BODY_MEDICAL_NEGLECT",
            "BODY_NEGLECT_APPEARANCE",
            "BODY_PSYCHOSOMATIC",
            "BODY_SELF_HARM",
            "BODY_ACUTE_HEALTH",

            // 2) Psychische / emotionale Anlässe
            "PSY_WITHDRAWAL",
            "PSY_ANXIETY",
            "PSY_DEPRESSIVE",
            "PSY_DISSOCIATION",
            "PSY_PARENTIFICATION",
            "PSY_AGGRESSION",
            "PSY_MOOD_SWINGS",
            "PSY_SELF_DEVALUATION",
            "PSY_FEAR_OF_PERSON",
            "PSY_ATTACHMENT",

            // 3) Hinweise auf Gewalt
            "VIO_CHILD_STATEMENT",
            "VIO_DV_STATEMENT",
            "VIO_THREATS",
            "VIO_PSYCH",
            "VIO_SEXUALIZED_BEHAVIOR",
            "VIO_SEXUAL_STATEMENT",
            "VIO_DIGITAL_SEX",

            // 4) Vernachlässigungsanzeichen
            "NEG_ABSENCE",
            "NEG_UNPUNCTUAL",
            "NEG_NO_SUPERVISION",
            "NEG_BASIC_NEEDS",
            "NEG_PARENT_OVERLOAD",
            "NEG_HOUSING",
            "NEG_DEV_DELAY",

            // 5) Kontextbezogene Anlässe (Eltern/Haushalt)
            "CTX_SUBSTANCE",
            "CTX_MENTAL_ILLNESS",
            "CTX_SEPARATION_CONFLICT",
            "CTX_POLICE",
            "CTX_PRIOR_CASES",
            "CTX_CHANGING_CARE",
            "CTX_PARENT_CONFLICT",

            // 6) Externe Mitteilungen
            "EXT_BY_PEER",
            "EXT_BY_PARENTS",
            "EXT_BY_POLICE",
            "EXT_BY_MEDICAL",
            "EXT_BY_YOUTH_OFFICE",
            "EXT_BY_COUNSELING",
            "EXT_ANON",
            "EXT_SELF",

            // 7) Schul-/Kita-spezifische Anlässe
            "EDU_PERFORMANCE_DROP",
            "EDU_BEHAVIOR_CHANGE",
            "EDU_SEXUAL_PLAY",
            "EDU_AGGRESSION_OTHERS",
            "EDU_EXHAUSTION",
            "EDU_NO_MATERIALS",
            "EDU_HUNGER",
            "EDU_DEV_UNCLARIFIED",

            // 8) Akutindikatoren
            "ACUTE_CURRENT_ABUSE",
            "ACUTE_THREAT",
            "ACUTE_FEAR_RETURN",
            "ACUTE_SEVERE_INJURY",
            "ACUTE_SUICIDALITY",

            // 9) Sonstiges
            "OTHER"
    ));

    public static Set<String> allowedCodes() {
        return Collections.unmodifiableSet(CODES);
    }

    public static boolean isAllowed(String code) {
        if (code == null) return false;
        return CODES.contains(code.trim());
    }
}