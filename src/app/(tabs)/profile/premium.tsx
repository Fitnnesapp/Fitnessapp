import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useSubscription } from '@/hooks/use-subscription';
import { confirmAction } from '@/lib/confirm';
import { TRIAL_DAYS, type Plan } from '@/lib/logic/entitlements';

const BENEFITS = [
  'Alle Home-Workout-Programme statt nur 3',
  'Kompletter Trainingsverlauf ohne Zeitlimit',
  'Muskelgruppen-Analyse deines Krafttrainings',
];

// Platzhalterpreise. Maßgeblich sind später die Preise aus dem App Store bzw. Google Play.
const PLANS: { plan: Plan; title: string; price: string; note: string }[] = [
  { plan: 'yearly', title: 'Jährlich', price: '29,99 € pro Jahr', note: 'Spart rund 50 Prozent' },
  { plan: 'monthly', title: 'Monatlich', price: '4,99 € pro Monat', note: 'Jederzeit kündbar' },
];

const STATE_TEXT = {
  free: 'Du nutzt die kostenlose Version.',
  trial: 'Deine Testversion läuft.',
  premium: 'Premium ist aktiv.',
  premium_ending: 'Dein Abo ist gekündigt und läuft noch bis zum Ende des Zeitraums.',
  expired: 'Dein Premium-Zugang ist abgelaufen.',
} as const;

export default function PremiumScreen() {
  const sub = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>, success?: string) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      if (success) setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das hat nicht geklappt.');
    } finally {
      setBusy(null);
    }
  }

  function manageSubscription() {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    void Linking.openURL(url);
  }

  return (
    <Screen>
      <AppText variant="display">Premium</AppText>
      <AppText color="textSecondary">{STATE_TEXT[sub.state]}</AppText>
      {sub.daysLeft !== null ? (
        <AppText variant="caption" color="textSecondary">
          Noch {sub.daysLeft} {sub.daysLeft === 1 ? 'Tag' : 'Tage'}.
        </AppText>
      ) : null}

      {sub.provider.simulated ? (
        <Card>
          <AppText variant="label" color="accent">
            TESTMODUS
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Entwicklungs-Build: Es wird nichts bezahlt, Käufe werden nur simuliert. In der fertigen App läuft das über
            den App Store bzw. Google Play.
          </AppText>
        </Card>
      ) : null}
      {!sub.provider.available ? (
        <Card>
          <AppText color="danger">Käufe sind in dieser Version noch nicht eingerichtet.</AppText>
        </Card>
      ) : null}

      <Card>
        <AppText variant="heading">Das bekommst du</AppText>
        {BENEFITS.map((benefit) => (
          <AppText key={benefit}>✓  {benefit}</AppText>
        ))}
      </Card>

      {!sub.isPremium ? (
        <>
          {sub.canStartTrial ? (
            <Button
              title={`${TRIAL_DAYS} Tage kostenlos testen`}
              loading={busy === 'trial'}
              disabled={!sub.provider.available || busy !== null}
              onPress={() => run('trial', sub.startTrial, 'Viel Spaß mit Premium!')}
            />
          ) : null}

          {PLANS.map((p) => (
            <Card
              key={p.plan}
              onPress={
                sub.provider.available && busy === null
                  ? () => run(p.plan, () => sub.purchase(p.plan), 'Danke! Premium ist freigeschaltet.')
                  : undefined
              }>
              <View>
                <AppText variant="heading">{p.title}</AppText>
                <AppText>{p.price}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {p.note}
                </AppText>
              </View>
            </Card>
          ))}
        </>
      ) : (
        <>
          {sub.state === 'premium' && sub.provider.simulated ? (
            <Button
              title="Abo kündigen (Test)"
              variant="danger"
              onPress={() =>
                confirmAction({
                  title: 'Abo kündigen?',
                  message: 'Der Zugang bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
                  confirmLabel: 'Kündigen',
                  onConfirm: () => void run('cancel', sub.cancel, 'Gekündigt.'),
                })
              }
            />
          ) : null}
          {sub.state === 'premium' || sub.state === 'premium_ending' ? (
            <Button title="Abo verwalten" variant="secondary" onPress={manageSubscription} />
          ) : null}
        </>
      )}

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      {message ? <AppText color="success">{message}</AppText> : null}

      <Button
        title="Käufe wiederherstellen"
        variant="ghost"
        loading={busy === 'restore'}
        disabled={!sub.provider.available || busy !== null}
        onPress={() => run('restore', sub.restore, 'Käufe wurden abgeglichen.')}
      />

      <AppText variant="caption" color="textSecondary">
        Das Abo verlängert sich automatisch, wenn es nicht mindestens 24 Stunden vor Ablauf in den Store-Einstellungen
        gekündigt wird. Die Zahlung läuft über deinen App-Store-Account. Alle Trainingsdaten bleiben auf deinem Gerät,
        auch ohne Premium.
      </AppText>
    </Screen>
  );
}
