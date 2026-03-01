-- V031__create_meldung_extern.sql

create table if not exists meldung_extern (
  id bigserial primary key,
  meldung_id bigint not null
    references meldungen(id)
      on delete cascade,

  stelle varchar(40) not null,
  stelle_sonstiges text,
  am timestamptz,
  begruendung text,
  ergebnis text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_meldung_extern_meldung
  on meldung_extern (meldung_id);