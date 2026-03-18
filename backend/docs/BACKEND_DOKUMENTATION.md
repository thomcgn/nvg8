# KIDOC Backend – Technische Dokumentation

> Letzte Aktualisierung: 2026-03-18

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Tech-Stack](#2-tech-stack)
3. [Architektur & Paketstruktur](#3-architektur--paketstruktur)
4. [Domain-Modell](#4-domain-modell)
5. [REST API Endpunkte](#5-rest-api-endpunkte)
6. [Services & Business-Logik](#6-services--business-logik)
7. [Datenbankschema (Flyway-Migrationen)](#7-datenbankschema-flyway-migrationen)
8. [Sicherheit & Authentifizierung](#8-sicherheit--authentifizierung)
9. [Externe Integrationen](#9-externe-integrationen)
10. [Admin-Funktionen](#10-admin-funktionen)
11. [Konfiguration](#11-konfiguration)

---

## 1. Projektübersicht

**KIDOC** ist ein webbasiertes Fallmanagement-System für den Kinderschutz. Es unterstützt Träger sozialer Einrichtungen bei:

- der Verwaltung von Kinderschutzfällen und Meldungen
- strukturierten Risikoeinschätzungen (Ampelsystem, DJI-Prüfbogen)
- der Erstellung und Versionierung von Meldungen, Schutzplänen und Hausbesuchen
- der Zusammenarbeit in Teams innerhalb einer mandantenfähigen Organisationsstruktur
- dem internen Messaging und der Fallfreigabe (intern & extern)
- einem integrierten Support-Ticket-System mit GitHub-Anbindung

Das System richtet sich an Fachkräfte im Kinderschutz (Sozialpädagogen, Teamleitungen, ISEFen) sowie Verwaltungsrollen innerhalb von Trägern.

---

## 2. Tech-Stack

| Kategorie         | Technologie                                   |
| ----------------- | --------------------------------------------- |
| Framework         | Spring Boot 4.0.2                             |
| Sprache           | Java 21                                       |
| Build             | Maven 3.x                                     |
| Datenbank         | PostgreSQL                                    |
| ORM               | Spring Data JPA / Hibernate                   |
| DB-Migrationen    | Flyway 11.14.1                                |
| Sicherheit        | Spring Security 6, JWT (JJWT 0.11.5)          |
| PDF-Generierung   | Apache PDFBox 2.0.30                          |
| API-Dokumentation | SpringDoc OpenAPI 3.0.1 (Swagger UI)          |
| Monitoring        | Spring Boot Actuator                          |
| Code-Generierung  | Lombok 1.18.42                                |
| Tests             | TestContainers (PostgreSQL), JUnit 5, MockMvc |

---

## 3. Architektur & Paketstruktur

Das Backend folgt einer klassischen **Schichtenarchitektur**:

```
Controller → Service → Repository → PostgreSQL
```

DTOs trennen die API-Verträge von den Entitäten. Alle Entitäten erben von `AuditableEntity` (automatisches `created_at`, `updated_at`, `created_by`, `updated_by`).

### Paketstruktur (`org.thomcgn.backend`)

```
org.thomcgn.backend/
├── admin/              # Demo-Reset
├── aktenzeichen/       # Aktenzeichen-Generierung
├── anlass/             # Anlasskatalog
├── audit/              # Audit-Trail
├── auth/               # Authentifizierung & Kontextwechsel
├── common/             # Basisklassen, Fehlerbehandlung, Security-Filter
├── config/             # CORS, Jackson, Properties
├── dji/                # DJI-Prüfbogen
├── dossiers/           # Kinderakten (KindDossier)
├── falloeffnungen/     # Falleröffnungen, Meldungen, Risiko
├── hausbesuch/         # Hausbesuche
├── invites/            # Einladungssystem
├── kinderschutz/       # Kinderschutzbogen
├── meldebogen/         # Meldebogen
├── messenger/          # Internes Messaging
├── orgunits/           # Organisationseinheiten
├── people/             # Kinder & Bezugspersonen
├── schutzplan/         # Schutzpläne
├── shares/             # Fallfreigaben (intern/extern)
├── support/            # Support-Tickets, GitHub-Webhook
├── teams/              # Teammitgliedschaften
├── tenants/            # Mandanten (Träger)
├── users/              # Nutzerverwaltung
└── BackendApplication.java
```

---

## 4. Domain-Modell

### Mandanten & Organisation

| Entität             | Beschreibung                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `Traeger`           | Hauptorganisation/Träger (mit Adresse, Nummernprefix)                               |
| `OrgUnit`           | Hierarchische Einheit: TRAEGER → EINRICHTUNG → ABTEILUNG → TEAM → GRUPPE → STANDORT |
| `OrgUnitMembership` | Zuordnung von Nutzern zu OrgUnits mit Rolle                                         |

### Nutzer & Zugang

| Entität  | Beschreibung                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `User`   | Systemnutzer (E-Mail, Passwort-Hash, Kompetenz-Tags)                                                                              |
| `Role`   | Enum: `SYSTEM_ADMIN`, `TRAEGER_ADMIN`, `EINRICHTUNG_ADMIN`, `FACHKRAFT`, `TEAMLEITUNG`, `ISEF`, `LESEN`, `SCHREIBEN`, `FREIGEBEN` |
| `Invite` | Einladungstoken (SHA-256 Hash, mit Ablaufdatum und Widerruf)                                                                      |

### Personen & Familie

| Entität            | Beschreibung                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| `Kind`             | Kindesentität (Name, Geburtsdatum, Geschlecht, Förderbedarf, Gesundheitsnotizen) |
| `Bezugsperson`     | Bezugsperson / Erziehungsberechtigter (mit Beziehungstyp)                        |
| `KindBezugsperson` | Verknüpfungstabelle Kind ↔ Bezugsperson                                          |

### Fallmanagement

| Entität               | Beschreibung                                                    |
| --------------------- | --------------------------------------------------------------- |
| `KindDossier`         | Akte eines Kindes pro Einrichtung                               |
| `Falleroeffnung`      | Geöffneter Kinderschutzfall (Status, Aktenzeichen, Zeitstempel) |
| `FalleroeffnungNotiz` | Notizen zu einem Fall                                           |
| `DossierFallNoSeq`    | Sequenzgenerator für Fallnummern pro Akte                       |

### Meldungen (Kernmodul)

`Meldung` ist das zentrale Berichtsobjekt mit vollständiger Versionierung:

| Feld/Enum             | Werte                                                       |
| --------------------- | ----------------------------------------------------------- |
| `MeldungStatus`       | `ENTWURF`, `EINGEREICHT`, `FREIGEGEBEN`, `KORREKT`, ...     |
| `MeldungType`         | `MELDUNG`, `KORREKT`, `NACHTRAG`, `UPDATE`, `NEUBEWERTUNG`  |
| `AmpelStatus`         | `ROT`, `GELB`, `GRUEN`, `UNBEWERTET`                        |
| `Datenbasis`          | `BEOBACHTUNG`, `ERZAEHLUNG`, `DRITTE`, `DOKUMENT`, `UNKLAR` |
| `Dringlichkeit`       | Dringlichkeitsstufen                                        |
| `Meldeweg`            | Meldewege                                                   |
| `MeldungChangeReason` | `CORRECTION`, `APPEND`, `UPDATE`, `REEVALUATION`            |

Zugehörige Sub-Entitäten: `MeldungObservation`, `MeldungAttachment`, `MeldungContact`, `MeldungExtern`, `MeldungJugendamt`.

### Risikoeinschätzung

| Entität                      | Beschreibung                                       |
| ---------------------------- | -------------------------------------------------- |
| `FalleroeffnungRiskSnapshot` | Risikomomentaufnahme zum Zeitpunkt der Einreichung |
| `TraegerRiskMatrixConfig`    | Risikomatrix-Konfiguration pro Träger              |
| `TraegerRiskIndicator`       | Risikoindikator-Definitionen                       |
| `FalleroeffnungAnlass`       | Anlasskategorie/Grund                              |

### Formulare & Planung

| Entität             | Beschreibung                    |
| ------------------- | ------------------------------- |
| `DjiAssessment`     | DJI-Prüfbogen                   |
| `Kinderschutzbogen` | Kinderschutz-Einschätzungsbogen |
| `Meldebogen`        | Meldebogenformular              |
| `Schutzplan`        | Schutzplan                      |
| `Hausbesuch`        | Hausbesuchsprotokoll            |

### Audit & Support

| Entität         | Beschreibung                                                    |
| --------------- | --------------------------------------------------------------- |
| `AuditEvent`    | Audit-Eintrag (Aktion, Entitätstyp/-id, Nutzer, Träger-Kontext) |
| `SupportTicket` | Support-Ticket (synchronisiert mit GitHub Issues)               |
| `Message`       | Interne Nachricht                                               |
| `CaseShare`     | Fallfreigabe (intern oder extern)                               |

---

## 5. REST API Endpunkte

### Authentifizierung & Kontext

| Method | Pfad             | Beschreibung                      |
| ------ | ---------------- | --------------------------------- |
| POST   | `/auth/login`    | Login (E-Mail + Passwort)         |
| POST   | `/auth/logout`   | Logout                            |
| POST   | `/auth/context`  | Organisationskontext wechseln     |
| GET    | `/auth/me`       | Aktueller Nutzer & Berechtigungen |
| GET    | `/auth/contexts` | Verfügbare Kontexte               |

### Fallmanagement

| Method | Pfad                           | Beschreibung                           |
| ------ | ------------------------------ | -------------------------------------- |
| GET    | `/api/akten`                   | Alle Akten auflisten                   |
| GET    | `/api/akten/{akteId}`          | Akte abrufen                           |
| GET    | `/api/kinder/{kindId}/akte`    | Akte eines Kindes abrufen/erstellen    |
| POST   | `/api/akten/{akteId}/faelle`   | Fall in Akte erstellen                 |
| GET    | `/falloeffnungen`              | Fälle auflisten (gefiltert, paginiert) |
| GET    | `/falloeffnungen/{id}`         | Fall abrufen                           |
| POST   | `/falloeffnungen`              | Fall erstellen                         |
| POST   | `/falloeffnungen/{id}/notizen` | Notiz hinzufügen                       |
| PATCH  | `/falloeffnungen/{id}/status`  | Status aktualisieren                   |

### Meldungen

| Method | Pfad                                                    | Beschreibung             |
| ------ | ------------------------------------------------------- | ------------------------ |
| GET    | `/falloeffnungen/{fallId}/meldungen`                    | Alle Meldungsversionen   |
| GET    | `/falloeffnungen/{fallId}/meldungen/current`            | Aktuelle Meldungsversion |
| GET    | `/falloeffnungen/{fallId}/meldungen/{meldungId}`        | Spezifische Version      |
| POST   | `/falloeffnungen/{fallId}/meldungen`                    | Neuen Entwurf erstellen  |
| POST   | `/falloeffnungen/{fallId}/meldungen/correct`            | Korrektur starten        |
| PUT    | `/falloeffnungen/{fallId}/meldungen/{meldungId}/draft`  | Entwurf speichern        |
| POST   | `/falloeffnungen/{fallId}/meldungen/{meldungId}/submit` | Meldung einreichen       |

### Personen

| Method   | Pfad                              | Beschreibung                |
| -------- | --------------------------------- | --------------------------- |
| POST     | `/api/kinder`                     | Kind anlegen                |
| GET      | `/api/kinder/{id}`                | Kind abrufen                |
| GET      | `/api/kinder`                     | Kinder suchen               |
| GET      | `/api/kinder/{id}/bezugspersonen` | Bezugspersonen eines Kindes |
| POST/GET | `/api/bezugspersonen`             | Bezugspersonen verwalten    |

### Formulare & Planung

| Method                   | Pfad | Beschreibung      |
| ------------------------ | ---- | ----------------- |
| `/api/dji`               |      | DJI-Prüfbogen     |
| `/api/meldebogen`        |      | Meldebogen        |
| `/api/schutzplan`        |      | Schutzpläne       |
| `/api/hausbesuch`        |      | Hausbesuche       |
| `/api/kinderschutzbo...` |      | Kinderschutzbögen |

### Risikoeinschätzung

| Method                 | Pfad | Beschreibung               |
| ---------------------- | ---- | -------------------------- |
| `/api/fall-risk`       |      | Risikoeinschätzungen       |
| `/admin/risk-matrix`   |      | Risikomatrix konfigurieren |
| `/api/risk-indicators` |      | Risikoindikatoren          |

### Administration

| Method             | Pfad                               | Beschreibung            |
| ------------------ | ---------------------------------- | ----------------------- |
| GET/POST           | `/admin/users`                     | Nutzer verwalten        |
| POST               | `/admin/users/{userId}/roles`      | Rolle zuweisen          |
| DELETE             | `/admin/users/{userId}/roles/{id}` | Rolle entfernen         |
| `/admin/traeger`   |                                    | Träger-Administration   |
| `/admin/org-units` |                                    | Organisationseinheiten  |
| GET                | `/api/audit`                       | Audit-Log               |
| POST               | `/admin/demo-reset`                | Demo-Daten zurücksetzen |
| POST               | `/admin/support-tickets/sync`      | GitHub-Sync auslösen    |

### Sonstiges

| Method   | Pfad                   | Beschreibung            |
| -------- | ---------------------- | ----------------------- |
| GET      | `/api/anlass-katalog`  | Anlasskatalog           |
| GET/POST | `/api/messages`        | Internes Messaging      |
| POST     | `/api/shares/internal` | Interne Fallfreigabe    |
| POST     | `/api/shares/external` | Externe Fallfreigabe    |
| GET      | `/api/inbox`           | Posteingang             |
| POST     | `/github/webhook`      | GitHub-Webhook-Receiver |

---

## 6. Services & Business-Logik

### Auth & Zugriff

| Service                | Aufgabe                          |
| ---------------------- | -------------------------------- |
| `AuthService`          | Login, Token-Generierung         |
| `ContextService`       | Organisationskontext-Wechsel     |
| `AuthQueryService`     | Nutzerprofilabfragen             |
| `PermissionService`    | Berechtigungsprüfungen           |
| `AccessControlService` | Zeilenbasierte Zugriffskontrolle |
| `AdminGuard`           | Admin-Autorisierungsprüfung      |

### Fallmanagement

| Service                 | Aufgabe                                    |
| ----------------------- | ------------------------------------------ |
| `FalleroeffnungService` | Fall-CRUD, Listing, Statuswechsel, Notizen |
| `AkteService`           | Akten-Management                           |
| `KindDossierService`    | Zugriff auf Kinderakten                    |
| `DossierFallNoService`  | Fallnummern-Sequenzen                      |

### Meldungs-Workflow (`MeldungService`)

Kernmodul mit komplexer Business-Logik:

1. **Entwurf erstellen** → Status `ENTWURF`
2. **Entwurf speichern** → Felder aktualisieren
3. **Einreichen** → Status `EINGEREICHT`, Risiko-Snapshot wird erstellt
4. **Freigeben** → Status `FREIGEGEBEN` (Freigabe-Rolle erforderlich)
5. **Korrektur starten** → Neue Version mit `MeldungType.KORREKT`, Original bleibt erhalten
6. **Nachtrag/Update/Neubewertung** → Neue versionierte Einträge

Jede Meldungsversion referenziert über `supersedes_id` die Vorgängerversion.

### Formulare & Planung

- `DjiService`, `MeldebogenService`, `SchutzplanService`, `HausbesuchService` – jeweils CRUD für ihre Formulare

### Support & Audit

| Service                    | Aufgabe                                  |
| -------------------------- | ---------------------------------------- |
| `AuditService`             | Audit-Events loggen                      |
| `SupportTicketService`     | Support-Ticket CRUD                      |
| `SupportTicketSyncService` | GitHub ↔ internes System synchronisieren |
| `GithubService`            | GitHub API Kommunikation                 |

### Sonstige

| Service              | Aufgabe                                                   |
| -------------------- | --------------------------------------------------------- |
| `InviteService`      | Einladungs-Generierung & Validierung (SHA-256 Token-Hash) |
| `AktennummerService` | Aktenzeichen-Generierung                                  |
| `DemoResetService`   | Demo-Daten-Reset (manuell & geplant)                      |
| `MessageService`     | Internes Messaging                                        |

---

## 7. Datenbankschema (Flyway-Migrationen)

### Überblick

61 versionierte Migrationen (`V001`–`V061`) + 1 wiederholbare Migration (`R__refresh_demo_seed.sql`).

| Migration | Inhalt                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------ |
| V001      | `traeger`                                                                                        |
| V002      | `org_units` (hierarchisch)                                                                       |
| V003      | `users`                                                                                          |
| V005      | `people` (Kind, Bezugsperson)                                                                    |
| V006      | `kind_dossiers`                                                                                  |
| V007      | `falloeffnungen`                                                                                 |
| V008      | `falloeffnung_notizen`                                                                           |
| V009      | `traeger_aktennummer_seq`                                                                        |
| V010      | `invites` (Token-Hash, Ablauf, Widerruf)                                                         |
| V011      | `audit_events`                                                                                   |
| V012      | `messenger`                                                                                      |
| V019      | `shares`                                                                                         |
| V020      | `fall_risk_matrix`                                                                               |
| V022      | `traeger_risk_indicators`                                                                        |
| V024      | `meldungen` (Kernmeldung)                                                                        |
| V025–V032 | Meldungs-Unterentitäten (Observationen, Tags, Anlässe, Kontakte, Jugendamt, Extern, Attachments) |
| V033      | Unique-Constraint: nur eine aktuelle Meldung pro Fall                                            |
| V034      | Fallnummer pro Akte                                                                              |
| V039      | `dossier_fallno_seq`                                                                             |
| V040      | `fall_meldung_version_seq`                                                                       |
| V044      | `support_tickets`                                                                                |
| V045      | Meldungs-Änderungsmetadaten                                                                      |
| V046      | `anlass_katalog` (13 KB Katalog)                                                                 |
| V047      | Mitarbeiter-Kompetenzen                                                                          |
| V049      | `user_team_memberships`                                                                          |
| V050      | Adressfelder                                                                                     |
| V051      | `system_admin`-Flag                                                                              |
| V052–V054 | `org_unit_memberships` (neues Mitgliedschaftsmodell)                                             |
| V055      | Veraltete S8a-Tabellen entfernt                                                                  |
| V056      | `kinderschutzbogen`                                                                              |
| V057      | `dji_pruefbogen`                                                                                 |
| V058      | `meldebogen`                                                                                     |
| V059      | `schutzplan`                                                                                     |
| V060      | `hausbesuch`                                                                                     |
| V061      | Enum-Status-Validierung erzwingen                                                                |
| R         | Demo-Seed zurücksetzen (112 KB)                                                                  |

### Schema-Konventionen

- **Soft Deletes**: `enabled BOOLEAN` statt physischem Löschen
- **Audit-Spalten**: `created_at`, `updated_at` (TIMESTAMPTZ), `created_by`, `updated_by` auf allen Entitäten
- **Versionierung**: `version_no`, `supersedes_id`, `corrects_id` in `meldungen`
- **Sequenzen**: Separate Sequenztabellen für Aktenzeichen und Fallnummern
- **Indizes**: Auf `traeger_id`, `org_unit_id`, `status` für Performance
- **FK-Constraints**: `ON DELETE RESTRICT` für Referenzintegrität

---

## 8. Sicherheit & Authentifizierung

### JWT-Zwei-Token-System

| Token         | Cookie   | Lebensdauer | Zweck                       |
| ------------- | -------- | ----------- | --------------------------- |
| `baseToken`   | `base`   | Lang        | Nutzeridentifikation        |
| `accessToken` | `access` | Kurz        | Organisations-Kontext-Scope |

Beide Cookies sind `HttpOnly`, `SameSite`, in Produktion `Secure`.

### Rollen & Berechtigungen (RBAC)

```
SYSTEM_ADMIN       → Vollzugriff, trägerübergreifend
TRAEGER_ADMIN      → Administration des eigenen Trägers
EINRICHTUNG_ADMIN  → Administration der eigenen Einrichtung
FACHKRAFT          → Fallarbeit, Meldungen erstellen/bearbeiten
TEAMLEITUNG        → Teamverwaltung + Fachkraft-Rechte
ISEF               → Insoweit erfahrene Fachkraft
FREIGEBEN          → Meldungen freigeben
SCHREIBEN          → Schreibzugriff
LESEN              → Lesezugriff
```

### Security-Filter-Chain

1. `JwtAuthFilter` – JWT aus Cookies extrahieren & validieren
2. `ContextRequiredFilter` – Aktiven Organisations-Kontext sicherstellen
3. `RawBodyCachingFilter` – GitHub-Webhook-Body cachen (für HMAC-Validierung)

### Öffentliche Endpunkte

- `/auth/login`, `/auth/logout`, `/auth/accept-invite`
- `/swagger-ui/**`, `/v3/api-docs/**`
- `/github/webhook` (HMAC-SHA256 via `X-Hub-Signature-256`)

### CORS

Erlaubte Origins: `localhost:3000`, `kidoc8a.de`
Methoden: GET, POST, PUT, PATCH, DELETE, OPTIONS
Credentials: erlaubt (Cookies)

---

## 9. Externe Integrationen

### GitHub-Integration

Support-Tickets werden bidirektional mit GitHub Issues synchronisiert:

| Komponente                    | Aufgabe                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `GithubWebhookController`     | Empfängt GitHub-Webhooks (issue opened/closed/reopened) |
| `SupportTicketSyncController` | Manueller Sync-Trigger                                  |
| `SupportTicketSyncScheduler`  | Automatischer periodischer Sync                         |
| `GithubService`               | GitHub REST API Kommunikation                           |
| `GithubStatusMapper`          | Status-Mapping GitHub ↔ internes System                 |

**Konfiguration:**

```
github.token=${GITHUB_TOKEN}
github.owner=thomcgn
github.repo=nvg8
github.webhook-secret=${GITHUB_WEBHOOK_SECRET}
```

### PDF-Generierung

Apache PDFBox wird für die Erstellung druckbarer und archivierbarer Formulare verwendet (Meldungen, Bögen, Schutzpläne).

### OpenAPI / Swagger

- Swagger UI: `/swagger-ui.html`
- API-Schema: `/v3/api-docs`

---

## 10. Admin-Funktionen

### Demo-Reset

| Aspekt  | Detail                                               |
| ------- | ---------------------------------------------------- |
| Manuell | `POST /admin/demo-reset` (nur `SYSTEM_ADMIN`)        |
| Geplant | Alle 6 Stunden (`0 0 */6 * * *`, konfigurierbar)     |
| Methode | Ausführung von `R__refresh_demo_seed.sql` via Flyway |

### Nutzerverwaltung

- Nutzer anlegen mit E-Mail & Passwort (BCrypt)
- OrgUnit-Mitgliedschaften & Rollen zuweisen/entfernen
- Nutzer aktivieren/deaktivieren
- Erforderliche Rolle: `TRAEGER_ADMIN` oder `EINRICHTUNG_ADMIN`

### Organisations-Administration

- Träger, OrgUnits, Teams verwalten
- Risikomatrix pro Träger konfigurieren
- Risikoindikatoren definieren

### Einladungssystem

- Einladungs-Token generieren (SHA-256 Hash, mit Ablaufdatum)
- Token widerrufen
- Nutzerannahme via `/auth/accept-invite`

### Audit-Log

Alle schreibenden Operationen erzeugen `AuditEvent`-Einträge:

- Entitätstyp & ID
- Nutzer & Träger-Kontext
- Aktion (CREATE, UPDATE, DELETE, SUBMIT, APPROVE, ...)
- Zeitstempel

---

## 11. Konfiguration

### application.properties (Auszug)

```properties
# Datenbank
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.jpa.hibernate.ddl-auto=validate

# Sicherheit
security.jwt.secret=<overridden via ENV in prod>
kidoc.cookies.secure=true

# Server
server.port=8080
server.ssl.enabled=false

# GitHub
github.token=${GITHUB_TOKEN}
github.owner=thomcgn
github.repo=nvg8
github.webhook-secret=${GITHUB_WEBHOOK_SECRET}

# Demo-Reset
kidoc.demo.reset-cron=0 0 */6 * * *
```

### Wichtige Konfigurations-Klassen

| Klasse              | Zweck                                          |
| ------------------- | ---------------------------------------------- |
| `SecurityConfig`    | Spring Security Setup (JWT, CORS, Auth-Regeln) |
| `CorsConfig`        | CORS Origins/Methoden/Header                   |
| `JacksonConfig`     | JSON-Serialisierung (LocalDate, LocalDateTime) |
| `JwtProperties`     | JWT TTL & Secret                               |
| `GithubProperties`  | GitHub API Konfiguration                       |
| `SupportProperties` | Support-System Einstellungen                   |

---

## Schlüsselprinzipien der Codebasis

- **Mandantenfähigkeit**: Jede Anfrage trägt einen Träger-Kontext; Datenzugriff ist immer auf den aktiven Kontext begrenzt
- **Vollständige Versionierung bei Meldungen**: Korrekturen, Nachträge und Neubewertungen erzeugen neue Versionen – keine Überschreibung
- **Lückenloses Audit-Trail**: Alle Entitäten erben von `AuditableEntity`
- **Soft Deletes**: Daten werden nie physisch gelöscht (`enabled = false`)
- **Sequenz-basierte Nummernvergabe**: Aktenzeichen und Fallnummern werden träger-/dossierspezifisch generiert
- **Token-Sicherheit**: Einladungs-Tokens werden nur als SHA-256-Hash gespeichert
