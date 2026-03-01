-- V028__create_meldung_changes.sql
-- Append-only ChangeLog für Meldungen

create table if not exists meldung_changes (
    id bigserial primary key,

    meldung_id bigint not null
        references meldungen(id)
            on delete restrict,

    section varchar(30) not null,
    field_path varchar(300) not null,

    old_value varchar(4000),
    new_value varchar(4000),

    reason varchar(2000) not null,

    changed_at timestamptz not null default now(),

    changed_by_user_id bigint not null
        references users(id)
            on delete restrict,

    changed_by_display_name varchar(200) not null
);

create index if not exists ix_meldung_change_meldung
    on meldung_changes (meldung_id);

create index if not exists ix_meldung_change_section
    on meldung_changes (section);