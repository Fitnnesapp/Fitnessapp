# Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running) mit React Native und Expo.
**Läuft offline**: kein Konto, kein Login. Alle Trainingsdaten bleiben auf dem Gerät. Einzige Verbindung: die öffentliche Event-Liste wird gelesen, ohne Nutzerdaten zu senden.

Entwicklungsplan: [claude-code-plan.md](claude-code-plan.md) · Projektregeln: [CLAUDE.md](CLAUDE.md)

> Der Plan sieht ursprünglich Supabase, Login und Social-Funktionen vor. Diese Teile entfallen,
> weil die App rein lokal arbeiten soll. Phase 5 (Social) und Teile von Phase 7 (Abo-Abgleich) entfallen deshalb.

## Status

- Expo-Projekt (TypeScript, Expo Router) mit Dunkel-/Hell-Design
- Tab-Navigation: Training, Verlauf, Profil, mit Platzhalter-Screens für die kommenden Phasen
- Profil mit Name und Einheiten, lokal gespeichert; Löschen aller Daten
- **Phase 1 (Kraft-Logger):**
  - Übungsbibliothek mit 62 Übungen, Suche, Filter nach Muskelgruppe und Equipment, Detailansicht mit Anleitung
  - Workout-Flow: Übungen hinzufügen, Sätze mit Gewicht, Wiederholungen und RPE, Aufwärmsätze, Ruhezeit-Timer
  - Autosave: ein laufendes Workout übersteht App-Neustarts
  - Zusammenfassung (Dauer, Volumen, Sätze, Rekorde), Verlauf nach Datum, Fortschrittsgrafik pro Übung
  - Rekord-Erkennung (🏆) für Höchstgewicht und Wiederholungen bei gleichem Gewicht
  - Vorlagen: Workout als Vorlage speichern und daraus starten
- **Phase 2 (Home-Workouts):**
  - 8 Programme (HIIT, Core, Mobility, Ganzkörper) mit Filter nach Kategorie, Dauer und Schwierigkeit
  - Workout-Player: Vorbereitung, Übungen und Pausen im Wechsel, Countdown-Signaltöne, Pause, Beenden, Fortschrittsanzeige (Übung 3 von 8)
  - Zeit wird aus Zeitstempeln berechnet, bleibt also bei gesperrtem Bildschirm korrekt; Bildschirm bleibt während des Trainings an
  - Zusammenfassung mit Dauer, geschätzten Kalorien (MET-Formel, Körpergewicht im Profil) und optionaler Anstrengung (1 bis 10)
  - Erscheint gemeinsam mit den Kraft-Workouts im Verlauf
- **Persönlicher Trainingsplan:** Willkommen-Screen und Fragebogen beim ersten Öffnen und im Profil: bis zu zwei Ziele, mehrere Orte, Geräte zu Hause, Lauferfahrung, Tage, Doppel-Einheiten, Zeit, Start; jeder Wochentag lässt sich selbst belegen; Wenn-Dann-Sätze, heutige Einheit auf dem Start-Bildschirm
- **Gesundheitsangaben (optional):** Alter, Gewicht, Beschwerden nur mit ausdrücklicher Einwilligung (Art. 9 DSGVO), nur lokal, im Profil widerrufbar; der Plan passt sich an (z. B. ohne Sprünge bei Knieproblemen)
- **Smarte Suche:** findet Funktionen, Übungen, Programme, Challenges und Events, versteht Fragen, Synonyme und Tippfehler, komplett auf dem Gerät
- **Illustrationen:** räumlich wirkende Vektorgrafiken (Kettlebell, Challenge-Titelbilder) direkt im Code, ohne Bilddateien
- **Challenges (offline):** Winter Arc 2026, 100 km im November, Neustart 2027, 30 Tage Gewohnheit; Fortschritt aus dem Verlauf, Etappen, faire Ziele für Spät-Einsteiger
- **Events:** große Läufe und Fitness-Wettkämpfe im Tab „Entdecken“, live aus `src/data/events.json` auf `main` geladen, offline aus dem Cache
- **Design-Begründung mit Studien:** [docs/design-psychologie.md](docs/design-psychologie.md)
- **Ausbau November 2026:**
  - **Fertige Kraft-Workouts:** 12 kuratierte Workouts für Studio und Zuhause (Ganzkörper, 5×5, Push, Pull, Beine & Po, Rumpf, Kurzhantel, Körpergewicht) mit Sätzen, Zielbereich und Pause je Übung; „Heute empfohlen“ nach Muskelerholung, passend zu Ort und Niveau aus dem Plan
  - **Progressions-Coach im Workout:** letztes Training je Übung und Ziel für heute (doppelte Progression), mit einem Tipp übernehmen; Ruhezeit startet mit der Pause der Übung
  - **Muskelkarte:** eigene SVG-Körperkarte vorne/hinten mit Haupt- und Hilfsmuskeln in Übungsdetails, Workouts, Zusammenfassung und Muskelanalyse; antippbar als Filter in der Übungsbibliothek
  - **Muskel-Erholung** auf dem Start-Tab (erholte Muskeln leuchten), **Wochensätze pro Muskel** mit dem Bereich 10 bis 20 Sätze
  - **Übungen tauschen** im laufenden Workout (Gerät besetzt) und Alternativen in den Übungsdetails
  - **Vergleich mit dem letzten ähnlichen Workout** in der Zusammenfassung (Volumen, bester Satz)
  - **Running-Seite neu:** Bestzeiten, Wettkampf-Prognose 5 km bis Marathon (Riegel-Formel), Lauf-Ideen nach dem 80/20-Prinzip, letzte Läufe
  - **Beständigkeits-Raster** der letzten 18 Wochen im Fortschritt (aktive Wochen statt lückenloser Tage)
  - **Datensicherung:** Export aller Daten als JSON-Datei und geprüftes Einspielen auf einem neuen Gerät (ohne Kaufstatus)
  - Animationen (Ringe, Balken, Einblenden; respektiert „Bewegung reduzieren“) und Haptik bei wichtigen Momenten
  - **Kraftziele:** Zielgewicht je Übung mit Fortschrittsbalken, nächstes Ziel auf dem Start-Tab, Erfolgsmoment beim Erreichen
  - **Rekordbuch:** bester Satz, geschätztes 1RM und meiste Wiederholungen je Übung
  - **Aufwärmsätze mit einem Tipp** passend zum Arbeitsgewicht (ladbare Gewichte, nie unter der leeren Stange)
  - Home-Workouts mit Bildkacheln je Kategorie, Programmdetails im neuen Stil
  - Einmalige Karte „Neu in deiner App“ für bestehende Nutzer; freundlicher Wochenrückblick für neue Nutzer
  - Workout-Player mit Ring-Timer und Vorschau auf die nächste Übung; Kilometerzeiten als Balken
  - Übungsfortschritt umschaltbar (Höchstgewicht, geschätztes 1RM, Volumen); Muskeln antippen öffnet passende Übungen
  - Workouts und Läufe als Text teilen (Teilen-Menü des Systems, nichts wird hochgeladen)
  - Fix: Bildkarten zeigten im Browser nur den linken Bildrand
  - Fix: Diagrammbeschriftung im Browser serifenlos und nicht mehr abgeschnitten
- **Verknüpfungen und Ausbau (4. November, Nachmittag):**
  - **Fix Rückfragen:** eigener Dialog im App-Design statt `window.confirm`. In eingebetteten Ansichten waren Browser-Dialoge gesperrt, dadurch ließen sich Challenges nicht verlassen und Einträge nicht löschen
  - Laufende Einheiten auf Start- und Training-Tab sichtbar, Punkt am Training-Tab; Tippen auf den aktiven Tab führt zu dessen Startseite
  - Plan beenden, sichere Rückwege nach dem Löschen, „Jetzt starten“ im Plan öffnet das passende fertige Workout
  - Übungen aus den Details direkt starten oder zum laufenden Workout hinzufügen; Workout im Verlauf nochmal machen; Übungen im Workout umsortieren
  - **Eigene Challenges** (Messgröße, Ziel, 7 bis 90 Tage), löschbar
  - **Events merken** mit Countdown und Vorbereitungsphase (Grundlage bis Tapering) auf dem Start-Tab
  - **Intervall-Timer** (Tabata, HIIT, EMOM, Sprints, eigene Zeiten)
  - **Notizen** zu Krafttrainings, auch im Feed; Kraftziel direkt bei der Übung im Workout
  - **Einstellungen:** Darstellung (Automatisch/Dunkel/Hell), Wochenziel ohne Plan, gemerkte Satzpause
  - Speicher-Migrationen: Einstellungen v3, Workouts v2, Challenges v2, neu: gemerkte Events v1
- **Ausbau (4. November, Abend):**
  - **Eigene Übungen** (Name, Hauptmuskel, Equipment, Notiz) mit Rekorden, Fortschritt, Zielen und Muskelanalyse; direkt aus der Auswahl im Workout anlegbar; löschbar, solange ungenutzt; Filter „Eigene“
  - **Läufe ohne GPS nachtragen** (Laufband, Uhr), mit Plausibilitätsprüfung; zählen für Verlauf, Ziele, Challenges und Prognose, nicht für 1/5/10-km-Bestzeiten
  - **Wochenziel fürs Laufen** in km bzw. mi mit Vorschlag (Schnitt der letzten vier Wochen plus 10 %)
  - **Pace-Rechner** mit Zwischenzeiten für 5 km bis Marathon
  - Übungsdetails mit den letzten fünf Einheiten samt Sätzen; zuletzt trainierte Übungen als Schnellauswahl im Workout
  - Verlauf filterbar nach Trainingsart
  - Speicher-Migrationen: Einstellungen v4, Läufe v1, neu: eigene Übungen v1
  - **Vorlagen-Editor** (Übungen hinzufügen, entfernen, umsortieren; neue Vorlage; fertige Workouts als Vorlage kopieren) und **gespeicherte Krafttrainings korrigieren** (Gewicht, Wiederholungen, Sätze entfernen)
  - Nachtrag: eigene Übungen und nachgetragene Läufe bearbeitbar; Auflegehilfe (Scheiben pro Seite) bei Langhantel-Übungen im Workout; Intervall-Timer merkt sich die letzten Einstellungen (Einstellungen v5); Laufbestzeiten im Rekordbuch; Laufziel auch im Profil und auf dem Start-Tab
- **Ausbau 6. November 2026 (Nutzen, Lauf & Rad, Apple Health):**
  - **Gesundheits-Nutzen** auf dem Start: Stand zur WHO-Empfehlung (150 Ausdauerminuten, 2 Krafttage), Vorwochen-Bilanz, erfüllte Wochen; auch im Erfolgsmoment nach jeder Einheit, im Plan („Was dir dieser Plan bringt“), als 12-Wochen-Verlauf im Fortschritt und im Jahresrückblick. Begründung: [docs/design-psychologie.md](docs/design-psychologie.md) (Abschnitt Nutzen-Analyse)
  - **Radfahren** mit GPS (km/h, Strecke, Höhenmeter) und zum Nachtragen (Indoor-Cycling); getrennt von Laufbestzeiten, Lauf-Challenges und Lauf-Abzeichen; Rad-Bestwerte im Rekordbuch, Abzeichen „Erste Radtour“ und „50 km am Stück“
  - **Auto-Pause** (Standzeiten ab 10 s zählen nicht), **Sprachansagen** pro Kilometer (Rad alle 5 km) und **Zieltempo** aus dem Pace-Rechner mit Live-Abweichung
  - **Apple Health**: Workouts, Läufe und Radtouren mit Strecke nach Health, ohne Duplikate, nur schreibend. Anleitung: [docs/health-sync.md](docs/health-sync.md)
  - **Automatische Updates** per expo-updates (Prüfung beim Start und bei Rückkehr, Hinweis „Jetzt neu starten“). Einrichtung: [docs/app-updates.md](docs/app-updates.md)
  - **Erinnerungen an Plan-Tagen** zur gewählten Tageszeit mit dem Wenn-Dann-Plan (höchstens eine am Tag)
  - **Dein Warum**: eigener Grund fürs Training, erscheint nach Pausen und zum Wochenstart
  - Willkommen mit Nutzenversprechen, Karte „Deine Daten“ im Profil, GPS mit iOS-Bewegungsart Fitness
  - Speicher-Migrationen: Einstellungen v9, Läufe v2, neu: Health-Abgleich v1
- **Phase 8 (Ausbau):**
  - Jahresrückblick (Start-Tab): Workouts, Zeit, Distanz, Volumen, Rekorde, längste Serie, stärkster Monat, Lieblingstag und -übung, wählbares Jahr
  - Vorschlag für heute aus einfachen, nachvollziehbaren Regeln (keine KI); führt nie zu einem Premium-Programm
  - **Health-Sync ist nicht umgesetzt** (nur mit Development Build und Gerät prüfbar), Vorgehen: [docs/health-sync.md](docs/health-sync.md)
- **Phase 7 (Monetarisierung), Grundgerüst:**
  - Zentrales Gating über `useSubscription()`; Free: 3 Home-Programme, 30 Tage Verlauf; Premium: alle Programme, voller Verlauf, Muskelgruppen-Analyse
  - Paywall mit 7-Tage-Testversion (einmalig), Plänen, Käufe wiederherstellen und Abo verwalten; Ablauf wird automatisch erkannt
  - **Echte Käufe sind noch nicht angebunden:** nur ein Test-Anbieter in Entwicklungs-Builds, in Release-Builds sind Käufe gesperrt. Anleitung: [docs/premium.md](docs/premium.md)
- **Phase 6 (Gamification):**
  - Serie mit Freeze: pro Monat 2 Freezes, die einen Tag ohne Training überbrücken; die Serie wird immer aus dem Verlauf berechnet
  - 10 Abzeichen (Workout-Meilensteine, 5 und 10 km, erster Rekord, Serien, Allrounder), jedes wird nur einmal vergeben
  - Optionale Erinnerung um 19 Uhr bei drohendem Serienverlust, höchstens einmal täglich, nur auf dem Handy und nur mit Erlaubnis
- **Phase 4 (Vereinheitlichung):**
  - Start-Tab mit Wochenübersicht (Workouts, Zeit, Distanz, Tage mit Training) und Serie aufeinanderfolgender Trainingstage
  - Verlauf mit Monatskalender, Tagesfilter und Icons je Trainingsart, alle drei Arten gemeinsam chronologisch
  - Alle Detailansichten nutzen denselben Kopf und dasselbe Kennzahlen-Raster
- **Phase 3 (Running):**
  - GPS-Tracking mit Start, Pause und Ende, Live-Anzeige von Zeit, Distanz, aktueller und durchschnittlicher Pace
  - Standortberechtigung erst beim Start mit Erklärung; Hintergrund-Aufzeichnung (Vordergrunddienst auf Android) mit Fallback auf Vordergrund
  - Punktefilter gegen ungenaue Messungen und GPS-Sprünge, Lücken werden in der Strecke gestrichelt gezeigt
  - Zusammenfassung mit Streckenansicht, Kilometerzeiten, Höhenmetern und Rekorden (längster Lauf, schnellster km, 5 km und 10 km)
  - Die Strecke wird ohne Kartenhintergrund gezeichnet, weil Kartenkacheln Internet bräuchten
  - Testplan für das Gerät (gesperrter Bildschirm, Akku): [docs/running-testplan.md](docs/running-testplan.md)

Signaltöne neu erzeugen: `node scripts/generate-sounds.js`

## Starten

```bash
npm install
npm start        # Dev-Server, dann w für den Browser (localhost:8081) oder mit Expo Go scannen
```

## Befehle

```bash
npm run typecheck    # TypeScript prüfen
npx eslint src       # Lint
npm test             # Unit-Tests der Logik (Rekorde, Volumen, Einheiten, Lauf-Auswertung, Workouts, Erholung, Sicherung)
```
