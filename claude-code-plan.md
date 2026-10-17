# Entwicklungsplan: All-in-One Fitness-App mit Claude Code

Stand: 17.10.2026
Zielgruppe dieses Dokuments: Du selbst, als Arbeitsgrundlage für Claude Code (Terminal-Agent)

---

## 0. Grundidee und Leitprinzip

Diese App vereint drei Trainingsarten in einer Anwendung:
1. **Gym/Kraft** (wie Strong, Hevy, Fitbod, JEFIT)
2. **Home-Workouts** (wie Freeletics, Nike Training Club, Seven, Peloton App)
3. **Running/Cardio** (wie Strava, Adidas Running, Garmin Connect)

**Leitprinzip für die Umsetzung:** Nicht alles auf einmal bauen. Alle erfolgreichen Fitness-Apps teilen denselben Kern (Tracking-Logger + Content-Bibliothek + Freemium-Paywall + Social-Layer) – genau diese Struktur bauen wir modular auf, Trainingsart für Trainingsart, Feature für Feature. Claude Code arbeitet am zuverlässigsten, wenn es pro Prompt genau EIN klar umrissenes Feature bekommt, das es selbst starten, testen und iterieren kann.

---

## 1. Technischer Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Frontend | React Native + Expo (TypeScript, Expo Router) | Claude Code kann Projekt, Dev-Server und Live-Preview per Expo Go selbst steuern; kein Mac/Xcode nötig, da EAS in der Cloud baut |
| Backend | Supabase (PostgreSQL) | Relationale Struktur passt zu Follower-Graphen/Feeds, planbare Kosten statt Pay-per-Read, Row-Level-Security für sensible Daten direkt in der DB |
| Auth | Supabase Auth | Integriert, unterstützt E-Mail + OAuth (Apple/Google Sign-In für App-Store-Konformität empfohlen) |
| GPS-Tracking | `expo-location` (+ Hintergrundmodus) | Offizielles Expo-SDK-Modul |
| Health-Sync | `@kingstinct/react-native-healthkit` (iOS) / Health-Connect-Modul (Android) | Für optionalen Import/Export von Schritten, Herzfrequenz, Workouts |
| Zahlungen/Abo | RevenueCat (abstrahiert Apple/Google IAP) oder Stripe für Web | App-Store-Richtlinien verlangen natives IAP für digitale Abos |
| State Management | Zustand oder React Query (Supabase-Sync) | Leichtgewichtig, gut mit Claude Code kompatibel |
| Karten (Running) | `react-native-maps` | Für Streckenanzeige |
| Push-Benachrichtigungen | `expo-notifications` | Für Erinnerungen/Streak-Warnungen |
| Diagramme | `victory-native` oder `react-native-gifted-charts` | Für Fortschrittsgrafiken |

---

## 2. Rechtliches – unbedingt vor dem ersten echten Nutzer klären

Die App verarbeitet Gesundheitsdaten (Herzfrequenz, GPS, Trainingsdaten, ggf. Gewicht) im Sinne von **Art. 9 DSGVO**. Das bedeutet:

- Verarbeitung ist grundsätzlich verboten, außer es greift eine Ausnahme – für eine Consumer-App ist das praktisch nur die **ausdrückliche, separate Einwilligung** (nicht in AGB versteckt)
- Pro Datenkategorie (GPS, Herzfrequenz, Körperdaten) eigene, widerrufbare Einwilligung einholen
- Technische Schutzmaßnahmen: Verschlüsselung, Pseudonymisierung, Zugriffsbeschränkung (§ 22 Abs. 2 BDSG)
- Löschfunktion für Nutzerdaten von Anfang an einbauen (Art. 17 DSGVO – "Recht auf Vergessenwerden")
- Keine sensiblen Daten für personalisierte Werbung nutzen
- Bußgeldrahmen: bis 20 Mio. € oder 4% des weltweiten Jahresumsatzes

➜ **Konkrete Empfehlung:** Baue den Consent-Flow (granulare Einwilligungs-Screens) bereits in Phase 0 mit ein, nicht erst kurz vor Launch nachrüsten. Vor echtem Nutzerbetrieb mit sensiblen Daten eine kurze Prüfung durch einen Datenschutzbeauftragten/Fachanwalt einplanen – ich bin kein Anwalt, das hier ist keine Rechtsberatung.

---

## 3. Datenmodell (Kernentitäten)

```
users
  id, email, created_at, display_name, avatar_url,
  consent_health_data (bool), consent_location (bool), consent_marketing (bool),
  consent_given_at, units_preference ('metric' | 'imperial')

workouts
  id, user_id, type ('strength' | 'home' | 'running'), started_at, ended_at, notes

strength_sets
  id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, is_warmup (bool)

exercises
  id, name, muscle_group, equipment, video_url, instructions, difficulty

home_sessions
  id, workout_id, program_id, duration_seconds, calories_estimate

programs
  id, name, description, difficulty, category, video_url, duration_minutes

running_tracks
  id, workout_id, distance_m, duration_seconds, avg_pace, elevation_gain,
  avg_heart_rate, max_heart_rate

gps_points
  id, running_track_id, lat, lng, timestamp, elevation, accuracy

personal_records
  id, user_id, exercise_id (nullable für Running-PRs), record_type
  ('max_weight' | 'max_reps' | 'fastest_5k' | ...), value, achieved_at, workout_id

follows
  follower_id, followee_id, created_at

feed_items
  id, user_id, workout_id, kudos_count, comment_count, created_at, visibility

kudos
  id, feed_item_id, user_id, created_at

comments
  id, feed_item_id, user_id, text, created_at

streaks
  user_id, current_count, longest_count, freeze_available (int),
  last_active_date, streak_type ('any_workout' | 'strength' | 'running')

badges
  id, key, name, description, icon_url

user_badges
  user_id, badge_id, earned_at

subscriptions
  user_id, plan ('free' | 'premium'), status, provider ('revenuecat' | 'stripe'),
  external_id, renews_at, trial_ends_at

push_tokens
  user_id, token, platform, created_at

body_measurements
  id, user_id, measured_at, weight_kg, body_fat_pct, notes
```

**Wichtig:** Ein generisches `workouts`-Objekt mit `type`-Feld, das je nach Trainingsart in eine der drei spezifischen Tabellen verzweigt – so bleibt der Verlauf/Kalender über alle drei Trainingsarten hinweg einheitlich abfragbar.

---

## 4. CLAUDE.md – Vorlage für den Projektstart

Lege diese Datei als Erstes im Projekt-Root an, damit Claude Code bei jedem Lauf dieselben Vorgaben kennt:

```markdown
# Projekt: [APP-NAME]

## Stack
- React Native + Expo (TypeScript, Expo Router)
- Supabase (Auth, Postgres, Storage)
- Zustand für lokalen State, React Query für Server-State

## Konventionen
- Komponenten in PascalCase, Dateien pro Komponente
- Alle Supabase-Queries über /lib/supabase mit typisierten Funktionen, nie inline in Components
- Screens unter /app (Expo Router Dateikonvention)
- Gemeinsame UI-Komponenten unter /components/ui
- Geschäftslogik (z.B. PR-Erkennung, Streak-Berechnung) in /lib/logic, testbar und UI-unabhängig

## Design
- [Hier: Farbpalette, Typografie, Referenz-Screenshots oder Beschreibung einfügen]
- Dunkelmodus-fähig von Anfang an
- Keine generische Standard-UI – [eigene Designsprache hier beschreiben]

## Regeln für Claude Code
- Immer nur EIN Feature pro Prompt umsetzen
- Nach jeder Änderung: npm/yarn Dev-Server-Fehler prüfen und beheben
- Keine Secrets/API-Keys in den Code schreiben, nur über .env
- Bei DB-Änderungen: Migration-Datei in /supabase/migrations anlegen, nicht nur im Supabase-Dashboard
- Row-Level-Security-Policy bei jeder neuen Tabelle sofort mit anlegen, nicht nachträglich
```

---

## 5. Phasenplan (ausführlich)

Jede Phase ist in Teilschritte mit Akzeptanzkriterien gegliedert. Die Zeitangaben sind grobe Richtwerte für einen Einzelentwickler mit Claude Code als Unterstützung, keine festen Deadlines.

---

### Phase 0 – Projekt-Setup (ca. 2–3 Tage)

**Ziel:** Ein lauffähiges, leeres App-Grundgerüst mit Auth, Navigation und Datenschutz-Flow, auf dem alle folgenden Phasen aufbauen.

**0.1 Projekt-Initialisierung**
- Expo-Projekt mit `create-expo-app`, TypeScript-Template, Expo Router anlegen
- Grundlegende Ordnerstruktur anlegen: `/app`, `/components`, `/lib`, `/supabase/migrations`, `/types`
- Git-Repository initialisieren, `.gitignore` für `.env`, `node_modules`
- Beispiel-Prompt: *"Lege ein neues Expo-Projekt mit TypeScript und Expo Router in diesem Ordner an. Nutze die Standard-Ordnerstruktur aus der CLAUDE.md. Richte Git mit einem ersten Commit ein."*

**0.2 Supabase-Projekt**
- Supabase-Projekt im Dashboard erstellen (EU-Region wählen, wichtig wegen DSGVO/Datenresidenz)
- Lokale Supabase-CLI einrichten für Migrationen
- `.env` mit Supabase-URL und Anon-Key anlegen, Beispiel-`.env.example` ins Repo
- Erste Migration: `users`-Tabelle (Erweiterung der Supabase-`auth.users`-Tabelle über eine `profiles`-Tabelle, da `auth.users` nicht direkt erweiterbar ist)
- Row-Level-Security aktivieren: Nutzer sehen/ändern nur eigene Zeilen

**0.3 Authentifizierung**
- Supabase Auth mit E-Mail/Passwort einrichten
- Apple Sign-In (Pflicht für iOS, wenn andere Social-Logins angeboten werden) und Google Sign-In einbauen
- Login-/Registrierungs-Screens bauen
- Session-Persistenz (Secure Store statt AsyncStorage für Tokens)
- Beispiel-Prompt: *"Baue Login- und Registrierungs-Screens mit Supabase Auth. Unterstütze E-Mail/Passwort sowie Apple und Google Sign-In. Speichere die Session sicher mit expo-secure-store."*

**0.4 Navigationsgerüst**
- Tab-Navigation: "Training" (Start neuer Workout), "Verlauf", "Profil"
- Platzhalter-Screens für jede Trainingsart (werden in Phase 1–3 gefüllt)
- Stack-Navigation innerhalb jedes Tabs für Detail-Screens

**0.5 Datenschutz-/Consent-Flow**
- Mehrstufiger Onboarding-Screen nach Registrierung: separate Einwilligungs-Toggles für Standortdaten, Gesundheitsdaten, Marketing
- Consent-Werte in `profiles`-Tabelle speichern, inkl. Zeitstempel
- Datenschutzerklärung und Nutzungsbedingungen verlinken (Platzhalter-Texte, später juristisch prüfen lassen)
- Einstellungsseite im Profil, auf der Einwilligungen jederzeit widerrufen werden können

**Akzeptanzkriterien Phase 0:**
- [ ] App startet auf echtem Gerät via Expo Go
- [ ] Registrierung/Login funktioniert, Session bleibt nach Neustart erhalten
- [ ] Consent-Screens müssen durchlaufen werden, bevor App nutzbar ist
- [ ] RLS-Policies verhindern nachweislich den Zugriff auf fremde Daten (mit zweitem Test-Account prüfen)

---

### Phase 1 – Erstes Modul: Kraft-Logger (ca. 3–4 Wochen)

**Ziel:** Ein vollständig nutzbares Kraft-Tracking-Modul, das für sich allein schon eine veröffentlichbare App wäre.

**1.1 Übungsbibliothek**
- `exercises`-Tabelle befüllen: 50–100 Standardübungen mit Muskelgruppe, benötigtem Equipment
- Such-/Filter-Screen (nach Muskelgruppe, Equipment)
- Detailansicht pro Übung (Beschreibung, optional Video/GIF – Lizenzfragen für Videomaterial früh klären, ggf. eigene einfache Illustrationen/Text statt lizenziertem Videomaterial)
- Beispiel-Prompt: *"Erstelle eine Migration für die exercises-Tabelle und befülle sie per Seed-Skript mit 50 gängigen Kraftübungen inkl. Muskelgruppe und Equipment. Baue einen Screen zum Durchsuchen und Filtern."*

**1.2 Workout-Flow**
- "Workout starten"-Button → Übungen aus Bibliothek hinzufügen
- Pro Übung: Sätze mit Gewicht/Wiederholungen/RPE eingeben, Satz als "erledigt" markieren
- Ruhezeit-Timer zwischen Sätzen (optional mit Push-Benachrichtigung bei Ablauf)
- Workout beenden → Zusammenfassungs-Screen (Gesamtvolumen, Dauer, trainierte Muskelgruppen)
- Autosave während des Workouts (bei Verbindungsabbruch/App-Schließen keine Datenverluste)

**1.3 Verlauf & Fortschritt**
- Liste vergangener Workouts, gruppiert nach Datum
- Detailansicht eines vergangenen Workouts
- Fortschrittsgrafik pro Übung (Gewichtsverlauf über Zeit) mit `victory-native`
- PR-Erkennungslogik in `/lib/logic/personalRecords.ts`: nach jedem gespeicherten Satz prüfen, ob neuer PR (max. Gewicht, max. Wiederholungen bei gegebenem Gewicht), bei Treffer in `personal_records` speichern und im UI sichtbar markieren (z.B. kleine Trophäe neben dem Satz)

**1.4 Eigene Trainingspläne (optional für MVP, aber empfohlen)**
- Einfache Plan-Vorlagen erstellen können ("Montag: Push", "Mittwoch: Pull")
- Beim Workout-Start einen Plan als Vorlage laden können

**Akzeptanzkriterien Phase 1:**
- [ ] Ein vollständiges Kraft-Workout kann von Start bis Zusammenfassung ohne Fehler durchlaufen werden
- [ ] Daten überleben einen App-Neustart mitten im Workout
- [ ] PRs werden korrekt erkannt (mit Testdaten verifizieren: gleicher Wert = kein neuer PR, höherer Wert = neuer PR)
- [ ] Fortschrittsgrafik zeigt reale Daten aus mind. 3 Testworkouts korrekt an

---

### Phase 2 – Zweites Modul: Home-Workouts (ca. 2–3 Wochen)

**Ziel:** Geführte, zeitbasierte Workouts ohne Equipment, analog zu Freeletics/Nike Training Club.

**2.1 Programm-Bibliothek**
- `programs`-Tabelle mit Kategorien (z.B. "HIIT", "Mobility", "Core"), Schwierigkeitsgrad, Dauer
- Übersichts-Screen mit Filterung nach Kategorie/Dauer/Schwierigkeit
- Detailansicht mit Übungsabfolge pro Programm

**2.2 Workout-Player**
- Timer-basierte Abfolge: Übung X Sekunden, Pause Y Sekunden, nächste Übung
- Audio-Countdown/Signalton bei Übergängen (wichtig, damit Nutzer nicht ständig aufs Handy schauen müssen)
- Pause-/Abbrechen-Funktion
- Fortschrittsanzeige während des Workouts (Übung 3 von 8)

**2.3 Content-Frage klären**
- Eigene Übungs-Videos/Animationen produzieren (lassen) oder Instruktions-Text + Standbilder nutzen – Video-Lizenzrecht ist ein eigenes, nicht-technisches Projekt (Model, Produktion, Hosting); für den MVP empfiehlt sich ein textbasierter/animierter Ansatz statt lizenziertem Fremdmaterial
- Video-Hosting bei Bedarf über Supabase Storage oder externen CDN-Dienst (Mux, Cloudflare Stream)

**2.4 Abschluss & Tracking**
- Nach Workout-Ende: Dauer, geschätzte Kalorien (grobe Formel nach MET-Wert pro Workout-Kategorie), optional subjektives Anstrengungsgefühl abfragen
- Eintrag ins gemeinsame `workouts`/`home_sessions`-Schema, erscheint damit automatisch im übergreifenden Verlauf (Phase 4)

**Akzeptanzkriterien Phase 2:**
- [ ] Ein komplettes Home-Workout kann mit korrektem Timing durchlaufen werden, auch wenn das Handy gesperrt/im Hintergrund ist
- [ ] Audio-Signale funktionieren zuverlässig
- [ ] Abgeschlossene Home-Workouts erscheinen im Verlauf neben Kraft-Workouts

---

### Phase 3 – Drittes Modul: Running (ca. 3–4 Wochen, technisch anspruchsvollster Teil)

**Ziel:** GPS-basiertes Lauftracking mit Live-Anzeige und Streckenkarte, analog zu Strava/Adidas Running.

**3.1 Berechtigungen & Grundgerüst**
- Standortberechtigung anfragen (erst im Kontext, nicht beim App-Start pauschal – siehe Onboarding-Best-Practice aus der vorherigen Analyse: Berechtigungsanfragen dort platzieren, wo der Nutzer den Grund unmittelbar versteht)
- iOS: "Immer erlauben" vs. "Nur bei App-Nutzung" – für Hintergrund-Tracking während gesperrtem Bildschirm ist "Immer" nötig, das muss im UI klar erklärt werden
- Android: Foreground-Service für zuverlässiges Hintergrund-Tracking einrichten

**3.2 Live-Tracking**
- Start/Pause/Stop-Steuerung
- `expo-location` mit sinnvollem Genauigkeits-/Intervall-Kompromiss konfigurieren (hohe Genauigkeit = hoher Akkuverbrauch, hier gezielt testen statt Standardwerte blind übernehmen)
- Live-Anzeige: verstrichene Zeit, Distanz, aktuelles Pace, ggf. Herzfrequenz bei verbundenem Wearable
- GPS-Punkte laufend in `gps_points` zwischenspeichern (lokal puffern, batch-weise an Supabase senden statt jeden Punkt einzeln, um Netzwerklast/Kosten zu reduzieren)

**3.3 Nach dem Lauf**
- Zusammenfassung: Distanz, Dauer, Durchschnitts-/Bestpace, Höhenmeter (falls verfügbar)
- Strecke auf Karte rendern (`react-native-maps` mit Polyline aus den gespeicherten GPS-Punkten)
- Lauf-PRs erkennen (schnellste 5 km, längste Distanz, etc.) – gleiche Logik-Schicht wie bei Kraft-PRs, nur andere Metrik

**3.4 Edge Cases, die früh getestet werden sollten**
- GPS-Signalverlust (Tunnel, dichte Bebauung) – Umgang mit Lücken in der Strecke
- App-Wechsel/Sperrbildschirm während des Laufs – Tracking darf nicht abbrechen
- Sehr lange Läufe (Marathon-Distanz) – Performance bei vielen tausend GPS-Punkten prüfen
- Akku-Verbrauch über eine reale 60-Minuten-Testsession messen und dokumentieren

**Akzeptanzkriterien Phase 3:**
- [ ] Ein 20-minütiger Testlauf mit gesperrtem Bildschirm wird vollständig und ohne Datenverlust aufgezeichnet
- [ ] Strecke wird korrekt auf der Karte dargestellt
- [ ] Akkuverbrauch pro Stunde Tracking ist gemessen und für Nutzer nachvollziehbar (z.B. in den Release Notes/FAQ)

---

### Phase 4 – Vereinheitlichung (ca. 1 Woche)

**Ziel:** Alle drei Trainingsarten fühlen sich wie eine App an, nicht wie drei zusammengeklebte Module.

- Gemeinsamer Kalender-/Verlaufs-Screen, der alle `workouts` unabhängig vom Typ chronologisch zeigt, mit typ-spezifischem Icon/Vorschau
- Zentrales Dashboard auf dem Home-Tab: Wochenübersicht (Anzahl Workouts, Gesamtdauer, Gesamtdistanz), aktueller Streak
- Einheitliches Detail-Layout-Muster, das sich je nach `type` unterschiedlich befüllt, statt drei komplett unterschiedlicher UI-Sprachen

**Akzeptanzkriterien Phase 4:**
- [ ] Verlaufs-Screen zeigt gemischte Workout-Typen korrekt sortiert
- [ ] Dashboard-Zahlen stimmen nachweislich mit den Einzel-Workouts überein (Stichprobe manuell nachrechnen)

---

### Phase 5 – Social-Layer (ca. 2 Wochen)

**Ziel:** Soziale Verbindlichkeit als Retention-Hebel – laut Analyse einer der am stärksten belegten Faktoren für langfristige Bindung.

**5.1 Follow-System**
- Nutzer suchen/finden (nach Name oder Einladungslink)
- Follow/Unfollow-Funktion, `follows`-Tabelle
- Profil-Screen mit Follower-/Following-Zahl und öffentlich sichtbaren Workouts (abhängig von `feed_items.visibility`)

**5.2 Feed**
- Chronologischer Feed aus Workouts der gefolgten Personen
- Pro Feed-Eintrag: Trainingsart-Icon, Kurzzusammenfassung (Dauer/Distanz/Volumen), Kudos-Button, Kommentarfunktion
- Privatsphäre-Einstellung pro Workout oder global (öffentlich/nur Follower/privat)

**5.3 Leaderboards (optional, spätere Ausbaustufe)**
- Pro Übung (Kraft) oder definierter Strecke (Running) Bestleistungen unter Freunden vergleichen

**Akzeptanzkriterien Phase 5:**
- [ ] Privatsphäre-Einstellungen werden zuverlässig respektiert (mit zwei Test-Accounts explizit prüfen, dass private Workouts nicht im fremden Feed erscheinen)
- [ ] Kudos/Kommentare funktionieren in Echtzeit oder mit kurzer Verzögerung sichtbar

---

### Phase 6 – Gamification (ca. 1 Woche)

**Ziel:** Motivation ohne künstliche Frustration – laut Analyse sollte Streak-Logik abgemildert statt hart "Alles-oder-Nichts" sein.

- Streak-Zähler (`streaks`-Tabelle), der bei täglicher/wöchentlicher Aktivität hochzählt
- "Freeze"-Mechanik: begrenzte Anzahl an Freezes pro Monat, die einen verpassten Tag nicht sofort den ganzen Streak kosten lassen
- Badge-System für Meilensteine (erstes Workout, 10 Workouts, erster 5-km-Lauf, 30-Tage-Streak)
- Dezente Benachrichtigung bei drohendem Streak-Verlust (nicht aufdringlich/manipulativ formulieren)

**Akzeptanzkriterien Phase 6:**
- [ ] Streak-Logik inkl. Freeze ist mit simulierten Testdaten (verschiedene Datenlücken) verifiziert
- [ ] Badges werden korrekt und einmalig vergeben (kein doppeltes Auslösen)

---

### Phase 7 – Monetarisierung (ca. 2 Wochen)

**Ziel:** Nachhaltiges Geschäftsmodell nach dem branchenüblichen Freemium-Muster.

**7.1 Feature-Grenzen definieren**
- Beispiel-Aufteilung: Gratis = Kraft-Logger + Home-Workouts eingeschränkt (z.B. 3 Programme) + Running Basis-Tracking; Premium = volle Programm-Bibliothek, erweiterte Analysen (Muscle-Heat-Map, Trainingsbelastung), unbegrenzter Verlauf, Leaderboards

**7.2 Paywall-Platzierung**
- Direkt nach dem personalisierten Onboarding (Ziel-Abfrage) platzieren – branchenweit die konversionsstärkste Stelle laut Analyse
- Trial-Option anbieten (z.B. 7 Tage), da Trial-Paywalls branchenweit die höchste Install-zu-Paid-Konversion erzielen

**7.3 Technische Umsetzung**
- RevenueCat-Integration für plattformübergreifendes Abo-Management (abstrahiert Apple/Google IAP-Unterschiede)
- `subscriptions`-Tabelle über Webhook synchron zum RevenueCat-/Store-Status halten
- Feature-Gating im Code zentral über einen Hook (`useSubscription()`) statt verstreuter Einzelprüfungen

**Akzeptanzkriterien Phase 7:**
- [ ] Trial-Start, Upgrade, Kündigung und Ablauf werden in allen Szenarien korrekt im UI widergespiegelt
- [ ] Restore-Purchases-Funktion (Pflicht für App-Store-Review) funktioniert

---

### Phase 8 – Health-Sync & Ausbaustufen (laufend)

**Ziel:** Integration ins bestehende Gesundheits-Ökosystem des Nutzers, danach gezielte, evidenzbasierte Weiterentwicklung.

- Apple HealthKit / Google Health Connect: Workouts optional exportieren, Schritte/Herzfrequenz optional importieren (jeweils eigene Einwilligung, siehe Abschnitt 2)
- Jahresrückblick-Feature (saisonal hoher Engagement-Hebel, wie bei Strava beobachtet)
- Adaptive Trainingsvorschläge: bewusst klein und transparent starten (z.B. einfache Regel-basierte Logik statt "Black-Box-KI"), da echte KI-Personalisierung laut Marktanalyse auch bei etablierten Apps noch kaum unabhängig belegte Wirksamkeit zeigt

**Akzeptanzkriterien Phase 8:**
- [ ] Health-Sync überträgt Daten nachweislich korrekt in beide Richtungen, ohne Duplikate zu erzeugen

---

## 6. Worauf du während der gesamten Umsetzung achten solltest

- **Ein Feature pro Prompt.** Große Sammel-Prompts ("baue die ganze App") führen zu schwer überprüfbaren, fehleranfälligen Ergebnissen.
- **Design explizit vorgeben.** Ohne klare Vorgaben in der CLAUDE.md tendiert generierter Code zu generischer Standard-UI.
- **Nach jedem Schritt auf echtem Gerät testen**, nicht nur im Simulator – besonders wichtig bei GPS und Health-Anbindung.
- **Datenbank-Änderungen immer als Migration**, damit der Stand nachvollziehbar und reproduzierbar bleibt.
- **App-Store-Review im Blick behalten:** Apple prüft kritisch auf "dünne"/vorlagenhafte Apps – jede Phase sollte echten, nutzbaren Mehrwert liefern, bevor an die nächste gegangen wird.
- **Entwicklerkonten einplanen:** Apple Developer Program 99 $/Jahr, Google Play Einmalgebühr 25 $.
- **Gesundheitsdaten-Compliance von Anfang an**, nicht als nachträglichen Punkt vor dem Launch (siehe Abschnitt 2).
- **Akku-Verbrauch beim GPS-Tracking** früh testen – das ist erfahrungsgemäß der Bereich mit den meisten Nutzerbeschwerden bei Running-Apps.
- **Video-/Bildrechte für Übungsanleitungen** früh klären – das ist ein rechtliches, nicht-technisches Risiko, das leicht übersehen wird.

---

## 7. Erste konkrete Schritte (heute/morgen umsetzbar)

1. Node.js und Expo CLI installieren, falls noch nicht vorhanden
2. Supabase-Account anlegen, neues Projekt in der EU-Region erstellen
3. Projektordner anlegen, Claude Code darin starten
4. CLAUDE.md aus Abschnitt 4 einfügen und mit App-Namen/Design-Vorgaben ergänzen
5. Mit Phase-0-Prompt aus Abschnitt 5 starten

---

*Dieser Plan ist als lebendes Dokument gedacht – nach jeder Phase lohnt sich ein kurzer Rückblick: Was hat gut funktioniert, was sollte für die nächste Phase angepasst werden.*
