import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ToggleRow } from '@/components/ui/toggle-row';
import { Radius, Spacing } from '@/constants/theme';
import { useCompleteConsent } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { authErrorMessage } from '@/lib/logic/auth-errors';
import { CONSENTS, NO_CONSENT, type ConsentValues } from '@/lib/logic/consent';

// Je Einwilligung ein eigener Schritt, danach eine Zusammenfassung mit Bestätigung der Bedingungen
const SUMMARY_STEP = CONSENTS.length;

export default function ConsentScreen() {
  const router = useRouter();
  const theme = useTheme();
  const complete = useCompleteConsent();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ConsentValues>(NO_CONSENT);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isSummary = step === SUMMARY_STEP;
  const definition = isSummary ? null : CONSENTS[step];

  return (
    <Screen topInset contentStyle={styles.content}>
      <View style={styles.progress}>
        {Array.from({ length: SUMMARY_STEP + 1 }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i <= step ? theme.accent : theme.surfaceAlt }]}
          />
        ))}
      </View>

      {definition ? (
        <>
          <AppText variant="label" color="textSecondary">
            SCHRITT {step + 1} VON {SUMMARY_STEP + 1}
          </AppText>
          <AppText variant="display">{definition.title}</AppText>
          <AppText color="textSecondary">{definition.summary}</AppText>

          <Card>
            {definition.details.map((line) => (
              <AppText key={line} variant="caption" color="textSecondary">
                {`•  ${line}`}
              </AppText>
            ))}
          </Card>

          <ToggleRow
            title={`${definition.title} erlauben`}
            description="Du kannst das jederzeit in den Datenschutz-Einstellungen widerrufen."
            value={values[definition.key]}
            onValueChange={(granted) => setValues((current) => ({ ...current, [definition.key]: granted }))}
          />

          <View style={styles.actions}>
            <Button title="Weiter" onPress={() => setStep(step + 1)} />
            {step > 0 ? <Button title="Zurück" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
          </View>
        </>
      ) : (
        <>
          <AppText variant="label" color="textSecondary">
            SCHRITT {SUMMARY_STEP + 1} VON {SUMMARY_STEP + 1}
          </AppText>
          <AppText variant="display">Alles im Blick.</AppText>
          <AppText color="textSecondary">Das hast du festgelegt. Änderungen sind jederzeit im Profil möglich.</AppText>

          <Card>
            {CONSENTS.map((c) => (
              <View key={c.key} style={styles.summaryRow}>
                <AppText>{c.title}</AppText>
                <AppText color={values[c.key] ? 'success' : 'textSecondary'} variant="heading">
                  {values[c.key] ? 'Erlaubt' : 'Aus'}
                </AppText>
              </View>
            ))}
          </Card>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            onPress={() => setTermsAccepted((accepted) => !accepted)}
            style={styles.checkRow}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsAccepted ? theme.accent : theme.border,
                  backgroundColor: termsAccepted ? theme.accent : 'transparent',
                },
              ]}>
              {termsAccepted ? (
                <AppText variant="label" style={{ color: theme.onAccent }}>
                  ✓
                </AppText>
              ) : null}
            </View>
            <AppText style={styles.flex}>Ich akzeptiere die Nutzungsbedingungen und habe die Datenschutzerklärung gelesen.</AppText>
          </Pressable>

          <View style={styles.links}>
            <Button title="Nutzungsbedingungen" variant="ghost" onPress={() => router.push('/legal/terms')} />
            <Button title="Datenschutzerklärung" variant="ghost" onPress={() => router.push('/legal/privacy')} />
          </View>

          {complete.isError ? (
            <AppText color="danger" accessibilityRole="alert">
              {authErrorMessage(complete.error)}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Fertig"
              loading={complete.isPending}
              disabled={!termsAccepted}
              onPress={() => complete.mutate(values)}
            />
            <Button title="Zurück" variant="ghost" onPress={() => setStep(step - 1)} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: Spacing.five },
  progress: { flexDirection: 'row', gap: Spacing.two },
  dot: { flex: 1, height: 4, borderRadius: Radius.pill },
  actions: { gap: Spacing.two, marginTop: Spacing.three },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: Radius.small,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
});
