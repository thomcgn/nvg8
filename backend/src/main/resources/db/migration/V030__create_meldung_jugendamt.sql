-- V030__create_meldung_jugendamt.sql

create table if not exists meldung_jugendamt (
  meldung_id bigint primary key
    references meldungen(id)
      on delete cascade,

  informiert varchar(40) not null,
  kontakt_am timestamptz,
  kontaktart varchar(40),
  aktenzeichen text,
  begruendung text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);