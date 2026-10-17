# Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running) mit React Native und Expo.
**Läuft komplett offline**: kein Konto, kein Login, keine Internetverbindung nötig. Alle Daten bleiben auf dem Gerät.

Entwicklungsplan: [claude-code-plan.md](claude-code-plan.md) · Projektregeln: [CLAUDE.md](CLAUDE.md)

> Der Plan sieht ursprünglich Supabase, Login und Social-Funktionen vor. Diese Teile entfallen,
> weil die App rein lokal arbeiten soll (Phase 5 Social und Teile von Phase 7 sind damit nicht umsetzbar).

## Status

- Expo-Projekt (TypeScript, Expo Router) mit Dunkel-/Hell-Design
- Tab-Navigation: Training, Verlauf, Profil, mit Platzhalter-Screens für die kommenden Phasen
- Profil mit Name und Einheiten, lokal gespeichert; Löschen aller Daten

## Starten

```bash
npm install
npm start        # Dev-Server, dann w für den Browser (localhost:8081) oder mit Expo Go scannen
```

## Befehle

```bash
npm run typecheck    # TypeScript prüfen
npx eslint src       # Lint
```
