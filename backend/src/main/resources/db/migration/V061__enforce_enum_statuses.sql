-- Enforce backend enum values for status columns and normalize legacy literals

-- Fallöffnungen: map legacy strings to the canonical FalleroeffnungStatus values
UPDATE falloeffnungen SET status = 'ABGESCHLOSSEN'
WHERE status IN ('GESCHLOSSEN', 'CLOSED');

UPDATE falloeffnungen SET status = 'OFFEN'
WHERE status = 'OPEN';

UPDATE falloeffnungen SET status = 'IN_PRUEFUNG'
WHERE status IN ('INPRUEFUNG', 'IN PRUEFUNG', 'IN-PRUEFUNG');

ALTER TABLE falloeffnungen
    ADD CONSTRAINT chk_falloeffnungen_status
        CHECK (status IN ('OFFEN', 'IN_PRUEFUNG', 'ABGESCHLOSSEN'));

-- Meldungen: keep status + fach_ampel aligned with enums
UPDATE meldungen SET status = 'ENTWURF'
WHERE status IN ('DRAFT');

UPDATE meldungen SET status = 'IN_BEARBEITUNG'
WHERE status IN ('IN_PROGRESS', 'IN PROGRESS', 'IN_BEARB', 'IN BEARBEITUNG', 'INBEARBEITUNG');

UPDATE meldungen SET status = 'ABGESCHLOSSEN'
WHERE status IN ('GESCHLOSSEN', 'CLOSED', 'FINAL');

ALTER TABLE meldungen
    ADD CONSTRAINT chk_meldungen_status
        CHECK (status IN ('ENTWURF', 'IN_BEARBEITUNG', 'ABGESCHLOSSEN'));

ALTER TABLE meldungen
    ADD CONSTRAINT chk_meldungen_fach_ampel
        CHECK (fach_ampel IS NULL OR fach_ampel IN ('GRUEN', 'GELB', 'ROT'));

-- Meldung-Kontakte: align with KontaktStatus enum
UPDATE meldung_contacts SET status = 'NICHT_ERREICHT'
WHERE status IN ('NICHT ERREICHT', 'NICHT-ERREICHT');

ALTER TABLE meldung_contacts
    ADD CONSTRAINT chk_meldung_contacts_status
        CHECK (status IN ('GEPLANT', 'ERREICHT', 'NICHT_ERREICHT', 'ABGEBROCHEN'));

-- Share requests
ALTER TABLE case_share_requests
    ADD CONSTRAINT chk_case_share_requests_status
        CHECK (status IN ('OPEN', 'APPROVED', 'REJECTED', 'EXPIRED'));

-- Support tickets
ALTER TABLE support_tickets
    ADD CONSTRAINT chk_support_tickets_status
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'));

-- Kommunikationsprofil: HoerStatus/CodaStatus
UPDATE users SET kp_hoer_status = 'UNBEKANNT'
WHERE kp_hoer_status IS NULL OR kp_hoer_status NOT IN ('UNBEKANNT', 'HOEREND', 'SCHWERHOERIG', 'GEHOERLOS');

ALTER TABLE users
    ADD CONSTRAINT chk_users_kp_hoer_status
        CHECK (kp_hoer_status IN ('UNBEKANNT', 'HOEREND', 'SCHWERHOERIG', 'GEHOERLOS'));

UPDATE users SET kp_coda_status = 'UNBEKANNT'
WHERE kp_coda_status IS NULL OR kp_coda_status NOT IN ('NEIN', 'JA', 'UNBEKANNT');

ALTER TABLE users
    ADD CONSTRAINT chk_users_kp_coda_status
        CHECK (kp_coda_status IN ('NEIN', 'JA', 'UNBEKANNT'));

