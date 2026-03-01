-- V032__create_meldung_attachments.sql

create table if not exists meldung_attachments (
  id bigserial primary key,
  meldung_id bigint not null
    references meldungen(id)
      on delete cascade,

  file_id bigint not null,
  typ varchar(40) not null,
  titel text,
  beschreibung text,
  sichtbarkeit varchar(40) not null,
  rechtsgrundlage_hinweis text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_meldung_attachments_meldung
  on meldung_attachments (meldung_id);