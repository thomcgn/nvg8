# Fachverfahren zur Dokumentation von §8a SGB VIII Fällen

Webbasierte Anwendung zur strukturierten Dokumentation und Organisation von Kinderschutzfällen nach §8a SGB VIII.

Die Anwendung unterstützt Fachkräfte im Sozialwesen bei der nachvollziehbaren Dokumentation von Fallverläufen und bietet eine technische Grundlage für strukturierte, revisionssichere Falldokumentation.

Das System wurde als moderne Full-Stack Webanwendung entwickelt und folgt einer klaren Trennung von Frontend, Backend und Datenbank.

---

# Live Demo

Live Demo  
https://kidoc8a.de

Demo Zugang

User: demo@kidoc.local
Password: demo

Die Demo enthält ausschließlich synthetische Testdaten.

---

# Hauptfunktionen

- Fallverwaltung
- Klientenverwaltung
- Strukturierte Falldokumentation
- Audit Log zur Nachvollziehbarkeit von Änderungen
- REST API Architektur
- JWT-basierte Authentifizierung
- Containerisiertes Deployment mit Docker
- Automatisiertes Deployment über CI/CD Pipeline

---

# Technologien

## Backend

- Java
- Spring Boot
- Spring Security
- JPA / Hibernate

## Frontend

- Next.js
- React
- TypeScript

## Datenbank

- PostgreSQL
- Flyway (Database Migration)

## Infrastruktur

- Docker
- CI/CD Pipeline
- automatisiertes Deployment

---

# Architekturansatz

Die Anwendung orientiert sich an Prinzipien der **Domain Driven Design (DDD)**.

Die Struktur trennt klar zwischen:

- API Kommunikation
- Geschäftslogik
- Domänenmodell
- Persistenz

Dies verbessert Wartbarkeit und Erweiterbarkeit der Anwendung.


---

# Authentifizierung

Die Anwendung verwendet **JWT-basierte Authentifizierung**.

Nach erfolgreicher Anmeldung wird ein JSON Web Token ausgestellt, das für die Authentifizierung weiterer Requests verwendet wird.

Die Benutzerinformationen werden im Backend über **JWT Principals** verarbeitet.

Der aktuelle Stand enthält einen initialen Benutzer für Demonstrationszwecke.

---

# Audit Log

Alle relevanten Änderungen an Falldaten werden über ein Audit Log nachvollziehbar protokolliert.

Das Audit Log dient der transparenten Dokumentation von Änderungen und unterstützt die Nachvollziehbarkeit sensibler Informationen.

---

# Deployment

Die Anwendung wird containerisiert mit Docker betrieben.

Bei Änderungen im Repository wird automatisch eine **CI/CD Pipeline** ausgelöst.

Pipeline Ablauf:

1. Code Push in Repository
2. Build der Anwendung
3. Erstellung eines Docker Images
4. Automatisiertes Deployment
5. Aktualisierung der laufenden Anwendung

Neue Versionen sind in der Regel innerhalb von **10–15 Minuten live verfügbar**.

---

# Entwicklung

Die Weiterentwicklung erfolgt über GitHub Issues.

Neue Features oder Verbesserungen werden als Tickets angelegt und anschließend umgesetzt.

Workflow:

1. Issue erstellen
2. Feature Branch entwickeln
3. Änderungen integrieren
4. Automatisches Deployment über CI/CD

---

# Roadmap

Geplante Erweiterungen:

- Rollenbasiertes Zugriffssystem (RBAC)
- Benutzerverwaltung
- Kalenderfunktion für Termine
- Terminverwaltung (z.B. Elterngespräche)
- Aufgabenverwaltung für Fachkräfte
- Benachrichtigungssystem
- PDF Export für Fallberichte zur Weitergabe an andere Träger
  unter Berücksichtigung von § 4 KKG (Gesetz zur Kooperation und Information im Kinderschutz)
