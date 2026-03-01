-- V025__create_meldung_observations.sql

create table if not exists meldung_observations (
                                                    id bigserial primary key,

                                                    meldung_id bigint not null
                                                        references meldungen(id)
                                                            on delete restrict,

    -- Inhalt (aus deinem Editor / DTO)
                                                    zeitpunkt timestamptz,
                                                    zeitraum varchar(30),
                                                    ort varchar(30),
                                                    ort_sonstiges varchar(200),
                                                    quelle varchar(30),

                                                    text varchar(4000) not null default '',
                                                    woertliches_zitat varchar(4000),
                                                    koerperbefund varchar(4000),
                                                    verhalten_kind varchar(4000),
                                                    verhalten_bezug varchar(4000),

                                                    sichtbarkeit varchar(30) not null default 'INTERN',

    -- ✅ Audit pro Observation (du wolltest: Name rein + gespeichert)
                                                    created_at timestamptz not null default now(),

                                                    created_by_user_id bigint not null
                                                        references users(id)
                                                            on delete restrict,

                                                    created_by_display_name varchar(200) not null
);

create index if not exists ix_meldung_obs_meldung
    on meldung_observations (meldung_id);

create index if not exists ix_meldung_obs_zeitpunkt
    on meldung_observations (zeitpunkt);