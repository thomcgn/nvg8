-- V029__create_meldung_contacts.sql

create table if not exists meldung_contacts (
  id bigserial primary key,
  meldung_id bigint not null
    references meldungen(id)
      on delete cascade,

  kontakt_mit varchar(40) not null,
  kontakt_am timestamptz,
  status varchar(40) not null,
  notiz text,
  ergebnis text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_meldung_contacts_meldung
  on meldung_contacts (meldung_id);