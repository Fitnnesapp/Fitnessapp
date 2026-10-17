# Fitnessapp

All-in-One Fitness-App (Kraft, Home-Workouts, Running) mit React Native, Expo und Supabase.
Entwicklungsplan: [claude-code-plan.md](claude-code-plan.md) · Projektregeln: [CLAUDE.md](CLAUDE.md)

## Status

Phase 0 (Projekt-Setup) ist umgesetzt:

- Expo-Projekt (TypeScript, Expo Router) mit Dunkel-/Hell-Design
- Supabase-Migrationen für `profiles` und `consent_log` inklusive Row-Level-Security
- Login/Registrierung mit E-Mail und Passwort, Google (Browser-OAuth) und Apple (iOS, nativ)
- Session-Speicherung im Secure Store (Keychain/Keystore)
- Tab-Navigation (Training, Verlauf, Profil) mit Platzhalter-Screens für spätere Phasen
- Mehrstufiger Consent-Flow, ohne den die App nicht nutzbar ist; Widerruf und Kontolöschung im Profil

## Einrichtung

1. Abhängigkeiten installieren: `npm install`
2. Supabase-Projekt in der **EU-Region** anlegen
3. `.env.example` nach `.env` kopieren und `EXPO_PUBLIC_SUPABASE_URL` sowie `EXPO_PUBLIC_SUPABASE_ANON_KEY` eintragen
4. Migrationen einspielen (Supabase CLI):
   ```bash
   npx supabase init        # einmalig, legt supabase/config.toml an
   npx supabase link --project-ref <PROJEKT-REF>
   npx supabase db push
   ```
5. In Supabase unter *Authentication → URL Configuration* diese Redirect-URLs erlauben:
   `fitnessapp://**` und für die Entwicklung `exp://**`
6. Optional: Provider unter *Authentication → Providers* aktivieren
   - **Google:** OAuth-Client in der Google Cloud Console anlegen, Client-ID und Secret in Supabase eintragen
   - **Apple:** Sign in with Apple einrichten (Apple Developer Account nötig). Apple-Login funktioniert nur auf echten iOS-Geräten bzw. in einem Development Build, nicht in Expo Go
7. App starten: `npm start` und mit Expo Go scannen

Ohne `.env` startet die App trotzdem und zeigt auf dem Login-Screen einen Hinweis.

## Befehle

```bash
npm start            # Dev-Server
npm run typecheck    # TypeScript prüfen
npx eslint src       # Lint
```

## RLS manuell prüfen

Zwei Test-Accounts registrieren. Im SQL-Editor von Supabase mit dem ersten Account (`set local role authenticated; select set_config('request.jwt.claims', '{"sub":"<USER-ID-1>"}', true);`)
`select * from public.profiles;` ausführen: es darf nur die eigene Zeile erscheinen. Ein `update` auf die Zeile des zweiten Accounts darf 0 Zeilen ändern.
