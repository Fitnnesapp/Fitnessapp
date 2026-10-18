# Running: Testplan auf dem echten Gerät

Das GPS-Tracking lässt sich nur auf einem Handy sinnvoll prüfen. Im Browser und in Tests ist nur die Auswertung
(Distanz, Pace, Splits, Rekorde) abgedeckt, nicht die Aufzeichnung selbst.

## Voraussetzungen

- Hintergrund-Standort läuft **nicht in Expo Go**, sondern braucht einen Development Build:
  `npx eas-cli@latest build --profile development --platform android` (bzw. `ios`)
- Beim Start des Laufs „Immer erlauben“ (iOS) bzw. „Immer zulassen“ (Android) wählen

## 1. Lauf mit gesperrtem Bildschirm (Kriterium aus Phase 3)

1. Lauf starten, Bildschirm sperren, 20 Minuten gehen oder laufen
2. Bildschirm entsperren: Zeit und Distanz müssen weitergelaufen sein
3. Lauf beenden: Strecke in der Zusammenfassung ist lückenlos, Distanz plausibel (mit einer bekannten Strecke vergleichen)

## 2. Randfälle (Plan 3.4)

| Fall | Erwartung |
|---|---|
| Tunnel oder dichte Bebauung | Lücke wird gestrichelt dargestellt, Distanz springt nicht unplausibel |
| Zu anderer App wechseln und zurückkehren | Aufzeichnung läuft weiter |
| App im Task-Switcher schließen und neu öffnen | Laufender Lauf ist noch da („Lauf läuft“ im Running-Hub) |
| Pause und Weiter | Pausenzeit zählt nicht zur Laufzeit |
| Flugmodus (nur GPS) | Aufzeichnung funktioniert, die App braucht kein Netz |
| Sehr langer Lauf (2 h oder mehr) | Zusammenfassung öffnet zügig, Streckenanzeige bleibt flüssig |

## 3. Akkuverbrauch (Kriterium aus Phase 3)

Ziel: Verbrauch pro Stunde Tracking messen und für Nutzer verständlich dokumentieren.

1. Akku auf mindestens 90 Prozent laden, Helligkeit auf festem Wert, Bildschirm gesperrt
2. 60 Minuten mit aktivem Lauf aufzeichnen (zum Vergleich einmal 60 Minuten ohne App im Leerlauf)
3. Verbrauch notieren: Start- und Endstand, Gerät, Betriebssystem
4. Ergebnis hier eintragen

| Datum | Gerät | System | Start | Ende | Verbrauch pro Stunde |
|---|---|---|---|---|---|
| | | | | | |

Stellschrauben, falls der Verbrauch zu hoch ist (`src/lib/location/tracker.ts`, Konstante `OPTIONS`):
`timeInterval` und `distanceInterval` erhöhen, oder `accuracy` auf `Location.Accuracy.High` senken.

## 4. Store-Hinweise

Apple und Google prüfen Apps mit Hintergrund-Standort genauer. Die Begründungstexte stehen in `app.json`
(Plugin `expo-location`). Auf Android erscheint während des Laufs eine Benachrichtigung (Vordergrunddienst).
