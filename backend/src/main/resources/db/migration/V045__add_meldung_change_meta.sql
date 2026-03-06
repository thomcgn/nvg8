-- V045__add_meldung_change_meta.sql
-- Ergänzende Metadaten für Versionen (Korrektur/Nachtrag/Update/Neubewertung)

alter table meldungen
    add column if not exists change_reason varchar(20);

alter table meldungen
    add column if not exists info_effective_at timestamptz;

alter table meldungen
    add column if not exists reason_text text;

create index if not exists ix_meldung_change_reason
    on meldungen (change_reason);
