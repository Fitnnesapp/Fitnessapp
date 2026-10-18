# Health-Sync (Apple Health, Health Connect): noch nicht umgesetzt

Der Health-Sync aus Phase 8 ist **bewusst nicht gebaut**, weil er nicht ohne echtes Gerät prüfbar ist:

- braucht native Module und damit einen Development Build (kein Expo Go, kein Browser)
- braucht Apple-Developer-Konto bzw. Health-Connect-Berechtigungen und Store-Freigaben
- das Akzeptanzkriterium („Daten werden in beide Richtungen korrekt übertragen, ohne Duplikate“) lässt sich nur auf dem Handy nachweisen

Ungetesteter Native-Code wäre hier schlechter als keiner.

## Empfohlenes Vorgehen

1. **Export zuerst** (Workouts nach Health schreiben), Import (Schritte, Herzfrequenz) später
2. Bibliotheken: `@kingstinct/react-native-healthkit` (iOS) und `react-native-health-connect` (Android), beide per Config-Plugin in `app.json`
3. **Einwilligung je Datenkategorie** und einzeln widerrufbar (Workouts schreiben, Herzfrequenz lesen, Schritte lesen); jeweils erst beim Einschalten anfragen, mit Erklärung
4. **Keine Duplikate:** beim Export die eigene Workout-Id als externe Kennung speichern (z.B. in einer lokalen Liste `exportedIds`) und nur Workouts ohne Eintrag schreiben. Beim Import Einträge überspringen, die von dieser App stammen
5. Abbildung: Kraft → Traditional Strength Training, Home → High Intensity Interval Training bzw. Core Training je Kategorie, Lauf → Running mit Route (aus `points`), Distanz und Höhe; Dauer und Kalorien aus den gespeicherten Werten
6. Der Abgleich bleibt optional; die App funktioniert ohne Health unverändert offline

## Was dafür schon da ist

- Alle Workouts liegen lokal mit stabilen Ids, Zeiten, Distanz und (bei Läufen) GPS-Punkten vor
- Die Kalorienschätzung für Home-Workouts steht (`src/lib/logic/calories.ts`)
