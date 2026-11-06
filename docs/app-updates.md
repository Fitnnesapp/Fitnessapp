# Automatische App-Updates

Stand: 6. November 2026. Eingebaut ist `expo-updates`:

- Beim Start fragt die App ohne Wartezeit nach einer neuen Version (`checkAutomatically: ON_LOAD`)
- Zusätzlich bei jeder Rückkehr in die App, höchstens alle 30 Minuten (`src/components/update-checker.tsx`)
- Eine neue Version lädt im Hintergrund und ist beim nächsten Öffnen aktiv; auf dem Start-Bildschirm erscheint
  „Neue Version geladen – Jetzt neu starten“, im Profil stehen Version und Status
- `runtimeVersion` folgt der App-Version: Änderungen am nativen Teil (neue Pakete, Berechtigungen) brauchen weiterhin
  einen neuen Store-Build, reine JavaScript-Änderungen kommen per Update

## Einmalig einrichten (braucht dein Expo-Konto)

```bash
npm install -g eas-cli
eas login
eas init              # verknüpft das Projekt, schreibt die projectId in app.json
eas update:configure  # trägt die Update-Adresse (updates.url) in app.json ein
eas build --platform ios --profile production
```

## Eine neue Version ausliefern

```bash
eas update --branch production --message "Kurzbeschreibung"
```

Ohne `eas update:configure` ist die Update-Prüfung abgeschaltet und die App verhält sich wie bisher.
