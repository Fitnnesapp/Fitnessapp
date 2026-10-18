# Premium: Aufbau und echte Käufe anbinden

## Was schon steht

- **Gating zentral:** Features fragen nur `useSubscription().isPremium` (`src/hooks/use-subscription.ts`).
- **Regeln (Free):**
  - Home-Programme: 3 von 7 (`FREE_PROGRAM_IDS` in `src/data/programs.ts`)
  - Verlauf: letzte 30 Tage sichtbar (`FREE_HISTORY_DAYS` in `src/app/(tabs)/history/index.tsx`), ältere Workouts bleiben gespeichert
  - Muskelgruppen-Analyse auf dem Start-Tab ist Premium
- **Abo-Stand:** `src/lib/logic/entitlements.ts` (Testversion 7 Tage, einmalig; Kauf; Kündigung mit Zugang bis Periodenende; Ablauf) und lokal gespeichert in `src/lib/storage/entitlement-store.ts`. Premium bleibt dadurch auch ohne Internet freigeschaltet, bis der Zeitraum endet.
- **Paywall:** Profil, Premium (`src/app/(tabs)/profile/premium.tsx`) mit Testversion, Plänen, „Käufe wiederherstellen“ und „Abo verwalten“.

## Was noch fehlt: echter Zahlungsanbieter

`src/lib/purchases/provider.ts` enthält die Schnittstelle `PurchaseProvider`.

- In Entwicklungs-Builds (`__DEV__`) läuft ein **Test-Anbieter**, der Käufe nur simuliert (kein Geld, klar als „Testmodus“ gekennzeichnet).
- In Release-Builds ist **kein Anbieter angebunden**: die Paywall zeigt „Käufe sind in dieser Version noch nicht eingerichtet“ und alle Kaufknöpfe sind gesperrt. So kann nie ein Premium-Zugang ohne Zahlung entstehen.

### RevenueCat anbinden (Schritte)

1. Apple Developer Program (99 $/Jahr) und Google Play Console (25 $ einmalig) einrichten, Abos in beiden Stores anlegen
2. RevenueCat-Projekt anlegen, Produkte und ein Entitlement `premium` konfigurieren
3. `npx expo install react-native-purchases` (braucht einen Development Build, läuft nicht in Expo Go)
4. In `provider.ts` einen `revenueCatProvider` schreiben:
   - `purchase`: `Purchases.purchasePackage(...)`, danach `customerInfo.entitlements.active.premium` in ein `Entitlement` übersetzen (`status`, `plan`, `renewsAt` aus `expirationDate`, Testphase über `periodType === 'TRIAL'`)
   - `restore`: `Purchases.restorePurchases()`
   - `startTrial`: entfällt, die Testphase kommt als Einführungsangebot des Stores
5. `purchaseProvider` auf den neuen Anbieter setzen (Release-Builds)
6. Preise aus den Store-Angeboten anzeigen statt der Platzhalter in `premium.tsx`
7. Beim App-Start `Purchases.getCustomerInfo()` abgleichen und den lokalen Stand aktualisieren. Offline gilt der gespeicherte Stand weiter.

Ohne Server entfällt der Webhook-Abgleich aus dem ursprünglichen Plan: der Stand wird direkt vom Store über das RevenueCat-SDK geholt.

## Store-Pflichten

- „Käufe wiederherstellen“ ist vorhanden (Pflicht für den App-Store-Review)
- Abo-Hinweistext mit Verlängerung und Kündigung steht auf der Paywall; Datenschutzerklärung und Nutzungsbedingungen müssen vor dem Launch verlinkt und juristisch geprüft werden
