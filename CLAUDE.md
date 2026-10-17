# Projekt: Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running). Entwicklungsplan: `claude-code-plan.md`.

## Stack
- React Native + Expo (TypeScript, Expo Router)
- Supabase (Auth, Postgres, Storage)
- Zustand für lokalen State, React Query für Server-State

## Konventionen
- Code liegt unter `src/` (Expo-Standard der aktuellen Vorlage): Routen in `src/app`, Rest daneben.
- Komponenten in PascalCase, eine Datei pro Komponente (Dateinamen kebab-case, wie von der Vorlage vorgegeben)
- Alle Supabase-Queries über `src/lib/supabase` mit typisierten Funktionen, nie inline in Components
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
- Nach jeder Änderung `npm run typecheck` und `npx expo lint` ausführen und Fehler beheben
- Keine Secrets/API-Keys in den Code schreiben, nur über `.env` (Vorlage: `.env.example`)
- Bei DB-Änderungen: Migration-Datei in `supabase/migrations` anlegen, nicht nur im Supabase-Dashboard
- Row-Level-Security-Policy bei jeder neuen Tabelle sofort mit anlegen, nicht nachträglich
- Neue Expo-Pakete immer mit `npx expo install <paket>` installieren (SDK-kompatible Versionen)
- Expo ändert sich pro SDK stark: bei Expo-/RN-APIs zuerst die Doku zur installierten Version prüfen
  (`https://docs.expo.dev/versions/v58.0.0/`, Index: `https://docs.expo.dev/llms.txt`)
- `ios/` und `android/` nie von Hand anlegen oder ändern, native Konfiguration nur über `app.json` und Config-Plugins
