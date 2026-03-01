-- V033__add_unique_current_per_fall.sql
-- Ein current pro Fall (partial unique index)

create unique index if not exists uq_meldung_current_per_fall
  on meldungen (falloeffnung_id)
  where current = true;