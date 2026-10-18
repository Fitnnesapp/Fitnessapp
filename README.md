# Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running) mit React Native und Expo.
**Läuft komplett offline**: kein Konto, kein Login, keine Internetverbindung nötig. Alle Daten bleiben auf dem Gerät.

Entwicklungsplan: [claude-code-plan.md](claude-code-plan.md) · Projektregeln: [CLAUDE.md](CLAUDE.md)

> Der Plan sieht ursprünglich Supabase, Login und Social-Funktionen vor. Diese Teile entfallen,
> weil die App rein lokal arbeiten soll. Phase 5 (Social) und Teile von Phase 7 (Abo-Abgleich) entfallen deshalb.

## Status

- Expo-Projekt (TypeScript, Expo Router) mit Dunkel-/Hell-Design
- Tab-Navigation: Training, Verlauf, Profil, mit Platzhalter-Screens für die kommenden Phasen
- Profil mit Name und Einheiten, lokal gespeichert; Löschen aller Daten
- **Phase 1 (Kraft-Logger):**
  - Übungsbibliothek mit 57 Übungen, Suche, Filter nach Muskelgruppe und Equipment, Detailansicht mit Anleitung
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
npm test             # Unit-Tests der Logik (Rekorde, Volumen, Einheiten, Lauf-Auswertung)
```
