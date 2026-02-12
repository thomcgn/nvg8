package org.thomcgn.backend.auth.data;

public enum Role {

    ADMIN,                 // Systemverwaltung

    FACHKRAFT,             // reguläre fallführende Fachkraft

    TEAMLEITUNG,           // darf freigeben, eskalieren, Berichte sehen

    IEFK,                  // insoweit erfahrene Fachkraft (§8a)

    READ_ONLY,             // z.B. Praktikum, externe Einsicht

    DATENSCHUTZBEAUFTRAGTER // Sonderrolle für Prüfzwecke
}
