# Projekt: Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running). Entwicklungsplan: `claude-code-plan.md`.

## Stack
- React Native + Expo (TypeScript, Expo Router)
- **Offline-first, ohne Konto und ohne Server**: alle Daten bleiben lokal auf dem Gerät
- Zustand mit AsyncStorage für Einstellungen; für Workouts ab Phase 1 `expo-sqlite`
- Keine Netzwerkzugriffe einbauen (kein Supabase, kein Login, keine Cloud-Dienste), außer der Nutzer entscheidet es ausdrücklich anders

## Konventionen
- Code liegt unter `src/` (Expo-Standard der aktuellen Vorlage): Routen in `src/app`, Rest daneben.
- Komponenten in PascalCase, eine Datei pro Komponente (Dateinamen kebab-case, wie von der Vorlage vorgegeben)
- Alle Zugriffe auf lokalen Speicher über `src/lib/storage` mit typisierten Funktionen, nie inline in Components
- Screens unter `src/app` (Expo Router Dateikonvention)
- Gemeinsame UI-Komponenten unter `src/components/ui`
- Geschäftslogik (z.B. PR-Erkennung, Streak-Berechnung) in `src/lib/logic`, testbar und UI-unabhängig
- UI-Texte auf Deutsch

## Design
- Dunkel zuerst, Hell-Modus wird unterstützt (Farben in `src/constants/theme.ts`)
- Anthrazit-Flächen mit einem einzigen Akzent (Limette), große Typografie, runde Karten
- Keine generische Standard-UI: immer die Komponenten aus `src/components/ui` und die Theme-Tokens nutzen

## Regeln für Claude Code
- Immer nur EIN Feature pro Prompt umsetzen
- Nach jeder Änderung `npm run typecheck` und `npx eslint src` ausführen und Fehler beheben
- Bei Änderungen am lokalen Datenmodell: versionierte Migration im Storage-Layer anlegen, damit bestehende Geräte-Daten erhalten bleiben
- Neue Expo-Pakete immer mit `npx expo install <paket>` installieren (SDK-kompatible Versionen)
- Expo ändert sich pro SDK stark: bei Expo-/RN-APIs zuerst die Doku zur installierten Version prüfen
  (`https://docs.expo.dev/versions/v58.0.0/`, Index: `https://docs.expo.dev/llms.txt`)
- `ios/` und `android/` nie von Hand anlegen oder ändern, native Konfiguration nur über `app.json` und Config-Plugins
