# Apple Health: Einheiten nach Health übertragen

Stand: 6. November 2026. Umgesetzt ist die **Übertragung nach Apple Health** (nur schreiben). Android Health Connect folgt.

## Was übertragen wird

| Einheit in der App | Workout in Apple Health | Zusätzlich |
|---|---|---|
| Krafttraining | Traditional Strength Training | – |
| Home-Workout HIIT / Core / Mobility / Ganzkörper | High Intensity Interval Training / Core Training / Flexibility / Functional Strength Training | geschätzte Kalorien |
| Lauf | Running | Distanz, GPS-Strecke |
| Radfahrt | Cycling | Distanz, GPS-Strecke |

- Nur Einheiten ab dem Verbinden (plus die 7 Tage davor, damit die Woche stimmt), nicht der ganze Verlauf
- Keine Duplikate: übertragene IDs werden lokal gemerkt (`fitnessapp-health-sync`), die eigene ID steht als `HKExternalUUID` in den Metadaten
- Die App liest keine Gesundheitsdaten

## Technik

- Bibliothek `@kingstinct/react-native-healthkit` (per `npx expo install`), Config-Plugin in `app.json` setzt die
  HealthKit-Berechtigung und die Texte für `NSHealthShareUsageDescription` und `NSHealthUpdateUsageDescription`
- Natives Modul wird nur im installierten iPhone-Build geladen (`src/lib/health/apple-health.ts`). Im Browser, auf
  Android und in **Expo Go** ist es nicht verfügbar; die App zeigt das im Profil an und funktioniert sonst unverändert
- Abbildung und Duplikatschutz: `src/lib/logic/health-export.ts` (getestet), Übertragung im Hintergrund:
  `src/components/health-sync-runner.tsx`

## Auf dem iPhone testen

1. Development Build oder TestFlight-Build erstellen (`eas build --profile development --platform ios`); Expo Go reicht nicht
2. Profil → Apple Health → „Mit Apple Health verbinden“ → im Apple-Dialog alle Kategorien erlauben
3. Ein kurzes Krafttraining und einen kurzen Lauf aufzeichnen
4. Health-App → Durchsuchen → Aktivität → Workouts: beide Einheiten erscheinen, der Lauf mit Strecke
5. App neu starten: es entstehen keine doppelten Einträge
