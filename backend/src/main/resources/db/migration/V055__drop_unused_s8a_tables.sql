-- V055: Drop unused §8a subsystem tables.
-- These tables (V013-V018) have no JPA entities and no Java code references them.
-- Drop order respects FK dependencies; CASCADE handles any remaining references.

DROP TABLE IF EXISTS s8a_assessment_participants CASCADE;
DROP TABLE IF EXISTS s8a_assessments              CASCADE;
DROP TABLE IF EXISTS s8a_case_person_relations    CASCADE;
DROP TABLE IF EXISTS s8a_contact_restrictions     CASCADE;
DROP TABLE IF EXISTS s8a_custody_records          CASCADE;
DROP TABLE IF EXISTS s8a_events                   CASCADE;
DROP TABLE IF EXISTS s8a_orders                   CASCADE;
DROP TABLE IF EXISTS s8a_case_persons             CASCADE;
DROP TABLE IF EXISTS s8a_cases                    CASCADE;
