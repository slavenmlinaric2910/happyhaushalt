# 1. Projektmerkmale (HappyHaushalt)

## 1.1 Zweck des Produkts

HappyHaushalt soll es ermöglichen, wiederkehrende Haushaltsaufgaben in WGs/Haushalten einfach zu planen, sichtbar zu machen und fair zu verteilen (Rotation), damit weniger Abstimmungsaufwand entsteht und Aufgaben zuverlässig erledigt werden – auch offline via installierbarer PWA.

## 1.2 Kunden, Beteiligte, Betroffene

Kunde/Auftraggeber: Projektteam bzw. Lehrveranstaltung (Mobile Software Engineering); fachlich: WG/Haushalt als "Kunde".

Profiteure: WG-Mitglieder/Haushaltsmitglieder, die Aufgaben transparent und fair organisieren wollen.

Beteiligte: Entwicklerteam (Konzeption, Umsetzung, Tests, Dokumentation), Endnutzer (Feedback/Testing).

Betroffene: alle Mitglieder eines Haushalts (Änderungen an Aufgaben/Rotation betreffen alle); indirekt ggf. Mitbewohner/Gäste, wenn Aufgabenverteilung und Sauberkeitsstatus kommuniziert wird.

## 1.3 Nutzer des Produkts (Rollen)

Haushaltsmitglied (Standardrolle): anmelden (Google OAuth), Haushalt erstellen/beitreten, Profil (Name/Avatar) wählen, Aufgaben ansehen, Aufgaben abschließen, Chore-Templates anlegen/bearbeiten (im MVP für alle erlaubt).

Haushalts-Owner/Ersteller: wie Standardrolle, zusätzlich "Owner"-Markierung; kann später optional Sonderrechte bekommen (z. B. Haushalt löschen/Member entfernen), ist im MVP aber nicht zwingend funktional getrennt.

# 2. Randbedingungen an das Produkt (HappyHaushalt)

## 2.1 Vorgegebene Randbedingungen an das Projekt

Projektform: Gruppenprojekt im Modul Mobile Software Engineering (Umsetzung als lauffähiger Prototyp inkl. Dokumentation/UML).

Plattform/Technik: Umsetzung als Progressive Web App (PWA) mit Fokus auf Mobile UX (installierbar, responsiv).

Offline-Fähigkeit: Offline-First ist eine zentrale Vorgabe/Designentscheidung (Nutzung auch ohne stabile Internetverbindung).

Technologie-Stack (festgelegt):

- Frontend: React + TypeScript + Vite
- PWA: Workbox / vite-plugin-pwa
- Offline-Persistenz: IndexedDB via Dexie
- Auth/Backend: Supabase (Google OAuth, Postgres)
- Tests: Vitest/RTL, optional Playwright (Smoke)

Organisation: Arbeit im Team mit Tickets/Board (z. B. GitLab), Code Reviews/Branching nach Konvention.

## 2.2 Namenskonventionen und Definitionen (Glossar)

**Household (Haushalt)**: Eine gemeinsame Gruppe (z. B. WG), in der Aufgaben organisiert werden.

**Join Code**: Ein 6-stelliger Code (z. B. K7P2QX) zum Beitritt in einen Haushalt.

**Member (Mitglied)**: Ein Nutzerkonto innerhalb eines Haushalts (authentifiziert via Supabase), mit display_name und avatar_id.

**Chore Template (Aufgaben-Template)**: Wiederkehrende Aufgabe als Vorlage (Name, Bereich/Area, Frequenz, optional Checkliste).

**Task / Task Instance**: Konkrete, fällige Ausprägung eines Templates (Due Date, Assigned Member, Status, CompletedAt).

**Rotation (Round-Robin)**: Regel zur fairen Zuweisung: nach Abschluss wird die nächste Aufgabe dem nächsten Mitglied zugeordnet.

**Offline Outbox / OfflineOp**: Warteschlange lokaler Änderungen, die offline entstehen und später synchronisiert werden.

**Repository (Repo-Pattern im Code)**: Abstraktionsschicht für Datenzugriff; UI greift nicht direkt auf DB/Supabase zu.

## 2.3 Relevante Fakten und Annahmen

**Ein Haushalt pro Nutzer (MVP)**: Ein Nutzer ist im MVP genau einem Haushalt zugeordnet (vereinfachte Domäne; kein Household-Switching).

**Onboarding**: Nach Login erstellt der Nutzer entweder einen Haushalt oder tritt per Join Code bei; danach wird ein Member-Profil erstellt (Name + Avatar).

**Persistenz/"Direkt Home"**: Nach erfolgreichem Beitritt/Erstellung wird der Member in der DB gespeichert, sodass Nutzer beim nächsten App-Start direkt auf die Home-Seite gelangen (kein erneutes Code-Eingeben).

**Online-Anforderungen**: Kernfunktionen sollen auch offline bedienbar sein; Synchronisation erfolgt nach Wiederverbindung (MVP: einfache, robuste Sync-Strategie).

**Zielgruppe/Umfeld**: Private Nutzung in kleinen Haushalten/WGs (typisch 2–8 Personen), keine Massenlast.

**Sicherheit/Datenschutz (MVP)**: Zugriff erfolgt nur für authentifizierte Nutzer; Datenzugriff ist über Supabase Auth/RLS grundsätzlich geschützt; es werden nur minimale personenbezogene Daten gespeichert (Name/Avatar).

# 3. Funktionale Anforderungen (HappyHaushalt)

## 3.1 Arbeitsumfang und Abgrenzung des Systems

Im Umfang (MVP):

- Authentifizierung per Google OAuth (Supabase Auth)
- Onboarding: Haushalt erstellen oder per 6-stelligem Join Code beitreten
- Profil-Setup beim ersten Beitritt: display_name setzen + Avatar (10 Optionen) wählen
- Haushalt-Ansicht: Join Code anzeigen/kopieren, Mitgliederliste anzeigen (Name + Avatar, Owner markiert)
- Chore Templates verwalten (CRUD light):
  - Template anlegen, bearbeiten, archivieren/löschen (MVP: archivieren optional)
  - Attribute: Name, Area, Frequenz, optionale Checkliste
- Tasks / Aufgabenliste:
  - Aufgaben aus Templates ableiten (Task Instances)
  - Aufgaben anzeigen (z. B. fällig/heute/überfällig)
  - Filter: Alle / Nur meine
- Task abschließen:
  - Setzt completedAt
  - Erzeugt nächste fällige Task Instance
  - Weist per **Round-Robin** dem nächsten Mitglied zu

# 4. Nicht-funktionale Anforderungen (HappyHaushalt)

## 4.1 Oberflächenanforderungen (Look & Feel)

**Calm & playful**: ruhige, freundliche UI ohne „Telefonbuch"-Optik; card-basiert, viel Weißraum, weiche Ecken, dezente Schatten.

**Illustrations-Style**: handgezeichnete/pen-artige Illustrationen (Haus-Mood, Areas) und humanoide Haushalts-Avatare konsistent im gleichen Stil.

**Mobile-first & responsiv**: optimiert für Smartphone-Nutzung, nutzbar bis ca. Tablet/Small Desktop.

**Klarer Fokus**: wenige primäre Aktionen pro Screen (z. B. Task abhaken, Template bearbeiten, Join-Code kopieren).

**Installierbar wie App**: PWA-typische App-Anmutung (App-Shell, feste Navigation, keine Browser-Überladung).

## 4.2 Benutzbarkeitsanforderungen

**Ohne Schulung nutzbar**: selbsterklärende Navigation, klare Texte (z. B. „Join Code tippen zum Kopieren").

**Minimale Eingaben**: Onboarding in wenigen Schritten (Login → Haushalt erstellen/joinen → Name/Avatar → Home).

**Fehlertoleranz**: verständliche Fehlermeldungen (z. B. „Code ungültig"), keine „leeren" Screens.

**Schnelle Kernaktionen**: Task als erledigt markieren mit 1–2 Taps; Filter „Alle/Nur meine" schnell erreichbar.

**Barrierearme Bedienung**: ausreichende Kontraste, große Touch-Targets, Tastaturbedienbarkeit wichtiger Controls (z. B. Avatar-Auswahl).

## 4.3 Performance, Durchsatz, Kapazität, Sicherheit

**Performance (Client)**:

- Initialer Screen-Load in typischer WLAN/4G-Umgebung zügig (Ziel: „gefühlt sofort", grob < 2s bis erste Inhalte).
- UI-Interaktionen (Tabwechsel, Listen scrollen, Checkbox/Complete) ohne spürbare Verzögerung.

**Kapazität (MVP-Annahme)**:

- Haushaltgröße typischerweise 2–8 Mitglieder.
- Anzahl Templates/Tasks pro Haushalt: im niedrigen dreistelligen Bereich.

**Stabilität**:

- Offline-Betrieb darf keine Daten verlieren; Sync-Fehler müssen sichtbar und wiederholbar sein (Retry).

**Sicherheit (Datenzugriff)**:

- Zugriff auf Haushaltsdaten nur für authentifizierte Nutzer und nur im eigenen Haushalt (Supabase Auth + RLS).
- Keine Speicherung von sensiblen Daten über das Notwendige hinaus (nur Name/Avatar/Haushaltszuordnung).

## 4.4 Operationelle Anforderungen

**Betrieb als Cloud-PWA**: Deployment als statische Web-App (z. B. Vercel/ähnlich) erreichbar über Browser.

**Installierbarkeit**: PWA muss auf iOS/Android/Desktop installierbar sein (Manifest + Service Worker).

**Backend-Betrieb**: Supabase als Managed Service (Auth + Postgres); keine eigene Server-Infrastruktur nötig.

**Offline-Verhalten**: App bleibt nutzbar bei Netzverlust; Änderungen werden lokal gespeichert und später synchronisiert.

## 4.5 Wartungs- und Portierungsanforderungen

**Modulare Architektur**: klare Schichten (UI → Feature → Repos → Storage/Sync) und getrennte Verantwortlichkeiten.

**Erweiterbarkeit**: neue Features (Notifications, Rollenrechte, Multi-Household) sollen ohne große Refactors möglich sein.

**Testbarkeit**: Kernlogik (z. B. Rotation) unit-testbar; kritische Flows smoke-testbar.

**Portierbarkeit**: PWA als primäres Ziel; optional später native Hülle möglich, ohne Logik neu zu schreiben.

## 4.6 Zugriffsschutzanforderungen

**Login via Google OAuth (Supabase Auth)** als Zugangsvoraussetzung.

**Haushaltszugang** nur über gültigen Join Code und DB-Regeln (Membership).

**Autorisierung über Member-Zuordnung**: nur Mitglieder dürfen Haushalt/Mitglieder/Tasks sehen.

**Owner-Markierung** vorhanden; gesonderte Owner-Rechte sind im MVP optional (können später ergänzt werden).

## 4.7 Kulturelle und politische Anforderungen

**Sprache**: Oberfläche primär Englisch (MVP), einfache Begriffe (Household, Task, Join).

**Kulturell neutral**: Avatare/Illustrationen ohne politische/anstößige Symbolik; humorvoll, aber respektvoll.

**DSGVO-Bewusstsein**: Datensparsamkeit und transparente Kommunikation, welche Daten gespeichert werden.

## 4.8 Rechtliche Anforderungen

**DSGVO (Grundsatz)**:

- Speicherung nur notwendiger personenbezogener Daten (Google-Login, display_name, Avatar-ID).
- Möglichkeit zur Account-Löschung/Entfernung perspektivisch (für Prototyp als Hinweis/To-Do ausreichend).

**Datenverarbeitung durch Dritte**: Supabase/Google als externe Dienste → Hinweis in Doku (Prototyp-Kontext).

**Sichere Übertragung**: Nutzung von HTTPS im Deployment (Standard bei Vercel/Supabase).

# 5. Projektrandbedingungen (HappyHaushalt)

## 5.1 Offene Punkte (Klärungsbedarf)

**Offline-Sync-Tiefe**: Welche Daten müssen im MVP vollständig offline verfügbar sein (nur Tasks/Chores oder auch Household/Members)?

**Rollen/Rechte**: Bleibt es im MVP bei „alle dürfen alles" oder braucht es minimale Owner-Rechte (z. B. Member entfernen)?

**Task-Generierung**: Werden Tasks "on the fly" beim Öffnen erzeugt oder per expliziter Aktion/Job (clientseitig)?

**Checklist-Handling**: Checkliste als reine Anzeige im Template oder auch als "Sub-Tasks" beim Erledigen?

**Leave Household**: Wird "Haushalt verlassen" im MVP wirklich benötigt oder nur UI-Platzhalter?

## 5.2 Fertiglösungen / Orientierung

**Tody** (inspiriert Look & Home/House-Mood Ansatz; reduziert und ruhig)

**Sweepy / OurHome / Flatastic** (WG-Aufgabenverteilung, teils gamifiziert → dient als Vergleich, aber bewusst nicht übernommen)

**Allgemeine To-do Apps** (Todoist, Microsoft To Do) als Referenz für Listen/Filter, jedoch ohne Haushalts-/Rotation-Fokus

## 5.3 Neue Probleme (mögliche Schwierigkeiten)

**PWA-Specials**: iOS-PWA Eigenheiten (Install, Storage Limits, Background Sync)

**Sync-Konflikte**: gleichzeitiges Bearbeiten/Abschließen derselben Task durch mehrere Nutzer

**RLS/DB-Fehlerbilder**: Supabase Policies können zu "works locally but not in prod" führen

**UI/UX-Feinschliff**: "calm & playful" konsequent halten, ohne Overdesign oder Unklarheit

## 5.4 Aufgaben (geplant / durchgeführt)

**Bereits durchgeführt (Baseline)**:

- Repo/Projektstruktur + Guardrails (CONTRIBUTING/ARCHITECTURE, Branch-Konventionen, Assets/Illustrationen)
- PWA-Scaffold (Vite + PWA Plugin) und Offline-Grundlage (Dexie + OfflineEngine/Outbox-Konzept)
- Supabase Projekt: Auth (Google OAuth), Tabellen, RLS/Policies
- Onboarding Flow (Create/Join Haushalt + Profil Name/Avatar) und Navigation zu Home

**Geplant (nächste Sprints / Tickets)**:

- Household Page finalisieren (echte Daten, Design polish)
- Chore Templates: Create/Edit (mit Frequenz + optional Checkliste)
- Task-Instanzen + Round-Robin Rotation bei Completion
- "My Tasks" Filter + Today/Overdue Ansicht
- Tests (Rotation Unit Tests, E2E Smoke) + CI grün
- Doku-Paket (Requirements, UML, Projektlog, Lessons Learned, Präsentation)

## 5.5 Inbetriebnahme und Migration

**Betrieb**: Deployment als PWA (z. B. Vercel oder GitLab Pages/ähnlich), Supabase als Backend.

**Migration**: Keine Übernahme alter Daten nötig (Neusystem/Prototyp).

**Produktiver Einsatz**: Im Kurskontext als Prototyp; optional nutzbar für eine echte WG nach Abschluss.

## 5.6 Risiken

**Technisch**:

- Offline-Sync und Konflikte werden komplexer als geplant
- RLS/Policy-Fehler blockieren Datenzugriff (insbesondere bei Member/Household Queries)
- PWA auf iOS eingeschränkt (Push/Sync/Storage je nach Version)

**Organisatorisch**:

- Zeitdruck durch parallele Bachelorarbeit/andere Module
- Scope Creep ("nur noch schnell Kalender/Notifications")
- Abstimmung/Code Reviews verzögern Merge in main

## 5.7 Kosten

**Zeitaufwand (fiktiv/Plan)**: ca. 20–35 Stunden pro Teammitglied (abhängig vom Umfang der Offline/Synchronisation)

**Betriebskosten (realistisch, gering)**:

- Supabase (Free/Starter je nach Nutzung)
- Deployment (Vercel free tier möglich)
- Sonstiges: keine Hardwarekosten, keine Lizenzen notwendig (Open Source Tooling)

## 5.8 Benutzerdokumentation und Schulung

**Kurzanleitung** (1–2 Seiten PDF/Markdown) mit Screenshots: Login → Haushalt beitreten → Task erledigen → Template anlegen

**In-App Microcopy**: kurze Hinweise (Join Code tippen zum Kopieren, Offline-Banner, Fehlermeldungen)

**Demo-Skript** für Präsentation (Happy Path + Offline-Fall)

## 5.9 Warteraum (später, nicht im MVP)

- Push Notifications (z. B. "Task überfällig")
- Multi-Household pro Nutzer + Household Switcher
- Rollen/Rechte (Owner Admin-Funktionen)
- Task-Kommentare / Notizen / Foto-Upload
- Kalenderansicht / ICS Export
- Analytics/Insights (Fairness/Done Counts) über MVP hinaus

## 5.10 Lösungsideen (Zukunft / Erweiterungen)

**Konfliktlösung im Sync**: einfache Last-Write-Wins Regeln oder Server-Checks (Task already completed)

**Smart Scheduling**: flexible Frequenzen, "skip/delay" Mechanik

**Haushalts-Insights**: minimale Fairness-Widgets (Done/Overdue) optional

**Internationalisierung**: DE zusätzlich zu EN

**Native Wrapper**: später als TWA/Capacitor möglich, ohne Logik neu zu schreiben
