-- V024__create_meldungen.sql (RADIKAL / MERGE)
-- Enthält jetzt ALLES (vormals Erstmeldung) im Root "meldungen"

create table if not exists meldungen (
                                         id bigserial primary key,

                                         falloeffnung_id bigint not null
                                             references falloeffnungen(id)
                                                 on delete restrict,

                                         version_no int not null,
                                         current boolean not null default true,

                                         status varchar(20) not null default 'ENTWURF',
                                         type varchar(20) not null default 'MELDUNG',

                                         supersedes_id bigint
                                             references meldungen(id)
                                                 on delete restrict,

                                         corrects_id bigint
                                             references meldungen(id)
                                                 on delete restrict,

                                         created_at timestamptz not null default now(),
                                         updated_at timestamptz not null default now(),

                                         created_by_user_id bigint not null
                                             references users(id)
                                                 on delete restrict,

                                         created_by_display_name varchar(200) not null,

                                         erfasst_von_rolle varchar(50),

    -- Meldung/Erstmeldung: Metadaten
                                         meldeweg varchar(50),
                                         meldeweg_sonstiges text,
                                         meldende_stelle_kontakt text,

                                         dringlichkeit varchar(50),
                                         datenbasis varchar(50),

                                         einwilligung_vorhanden boolean,
                                         schweigepflichtentbindung_vorhanden boolean,

    -- Inhalt
                                         kurzbeschreibung varchar(4000) not null default '',

    -- Fachliche Einschätzung
                                         fach_ampel varchar(20),
                                         fach_text varchar(4000),

                                         abweichung_zur_auto varchar(40),
                                         abweichungs_begruendung text,

    -- Akut
                                         akut_gefahr_im_verzug boolean not null default false,
                                         akut_begruendung text,
                                         akut_notruf_erforderlich boolean,
                                         akut_kind_sicher_untergebracht varchar(20),

    -- Verantwortlichkeiten / Planung
                                         verantwortliche_fachkraft_user_id bigint
                                             references users(id)
                                                 on delete restrict,

                                         naechste_ueberpruefung_am date,
                                         zusammenfassung text,

    -- Auto Risk Snapshot (optional)
                                         auto_risk_snapshot_id bigint
                                             references falloeffnung_risk_snapshots(id)
                                                 on delete restrict,

    -- Submit/Abschluss
                                         submitted_at timestamptz,

                                         submitted_by_user_id bigint
                                             references users(id)
                                                 on delete restrict,

                                         submitted_by_display_name varchar(200),

                                         freigabe_am timestamptz,

                                         freigabe_von_user_id bigint
                                             references users(id)
                                                 on delete restrict,

                                         constraint uq_meldung_version unique (falloeffnung_id, version_no)
);

create index if not exists ix_meldung_fall
    on meldungen (falloeffnung_id);

create index if not exists ix_meldung_current
    on meldungen (falloeffnung_id, current);

create index if not exists ix_meldung_corrects
    on meldungen (corrects_id);