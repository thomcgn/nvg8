-- V027__create_meldung_anlass_codes.sql

create table if not exists meldung_anlass_codes (
    meldung_id bigint not null
        references meldungen(id)
            on delete restrict,

    code varchar(100) not null,

    primary key (meldung_id, code)
);

create index if not exists ix_meldung_anlass_meldung
    on meldung_anlass_codes (meldung_id);

create index if not exists ix_meldung_anlass_code
    on meldung_anlass_codes (code);