-- V062: Normalize invalid BezugspersonBeziehung values and enforce valid enum values
--
-- Background: Demo/legacy data contained values like 'TANTE' that are not defined
-- in the BezugspersonBeziehung enum. JPA/Hibernate throws an
-- InvalidDataAccessApiUsageException when it tries to map these to the enum,
-- resulting in HTTP 500 errors. All unknown values are mapped to SONSTIGE (catch-all).
-- A CHECK constraint prevents invalid values from being inserted in the future.

-- Valid values as defined in BezugspersonBeziehung enum
-- MUTTER, VATER, SORGEBERECHTIGT, PFLEGEMUTTER, PFLEGEVATER,
-- STIEFMUTTER, STIEFVATER, GROSSMUTTER, GROSSVATER, SONSTIGE

-- 1. Normalize bezugspersonen.beziehung
UPDATE bezugspersonen
SET beziehung = 'SONSTIGE'
WHERE beziehung IS NOT NULL
  AND beziehung NOT IN (
    'MUTTER', 'VATER', 'SORGEBERECHTIGT',
    'PFLEGEMUTTER', 'PFLEGEVATER',
    'STIEFMUTTER', 'STIEFVATER',
    'GROSSMUTTER', 'GROSSVATER',
    'SONSTIGE'
  );

-- 2. Normalize kind_bezugspersonen.beziehung
UPDATE kind_bezugspersonen
SET beziehung = 'SONSTIGE'
WHERE beziehung NOT IN (
    'MUTTER', 'VATER', 'SORGEBERECHTIGT',
    'PFLEGEMUTTER', 'PFLEGEVATER',
    'STIEFMUTTER', 'STIEFVATER',
    'GROSSMUTTER', 'GROSSVATER',
    'SONSTIGE'
  );

-- 3. Add CHECK constraints so no invalid values can be inserted in the future
ALTER TABLE bezugspersonen
    ADD CONSTRAINT chk_bezugspersonen_beziehung
        CHECK (beziehung IS NULL OR beziehung IN (
            'MUTTER', 'VATER', 'SORGEBERECHTIGT',
            'PFLEGEMUTTER', 'PFLEGEVATER',
            'STIEFMUTTER', 'STIEFVATER',
            'GROSSMUTTER', 'GROSSVATER',
            'SONSTIGE'
        ));

ALTER TABLE kind_bezugspersonen
    ADD CONSTRAINT chk_kind_bezugspersonen_beziehung
        CHECK (beziehung IN (
            'MUTTER', 'VATER', 'SORGEBERECHTIGT',
            'PFLEGEMUTTER', 'PFLEGEVATER',
            'STIEFMUTTER', 'STIEFVATER',
            'GROSSMUTTER', 'GROSSVATER',
            'SONSTIGE'
        ));
