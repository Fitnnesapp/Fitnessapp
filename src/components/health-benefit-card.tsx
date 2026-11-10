import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBenefitEntries, useWeeklyBenefit } from '@/hooks/use-weekly-benefit';
import { weekStart } from '@/lib/logic/activity';
import { benefitMessage, WHO_AEROBIC_MINUTES, WHO_STRENGTH_DAYS, weeksMet } from '@/lib/logic/health-benefit';

/**
 * Übersetzt Training in persönlichen Nutzen: Fortschritt zur WHO-Empfehlung dieser Woche.
 * Gewinn-Rahmung (was du erreichst), weil sie bei Vorsorgeverhalten wie Bewegung besser wirkt
 * als Verlust-Rahmung (Gallagher & Updegraff 2012).
 */
export function HealthBenefitCard({ now }: { now: number }) {
  const theme = useTheme();
  const benefit = useWeeklyBenefit(now);
  const lastWeek = useWeeklyBenefit(now, 1);
  const entries = useBenefitEntries();
  const metWeeks = useMemo(() => weeksMet(entries, weekStart(now)), [entries, now]);
  // Zu Wochenbeginn (Mo, Di) die Bilanz der Vorwoche zeigen, damit das Erreichte nicht einfach verschwindet
  const weekday = new Date(now).getDay();
  const showLastWeek = (weekday === 1 || weekday === 2) && (lastWeek.aerobicMinutes > 0 || lastWeek.strengthDays > 0);
  const [open, setOpen] = useState(false);
  const both = benefit.aerobicMet && benefit.strengthMet;

  return (
    <Card>
      <View style={styles.head}>
        <Ionicons name={both ? 'heart' : 'heart-outline'} size={20} color={theme.accent} />
        <AppText variant="label" color="textSecondary" style={styles.flex}>
          DEIN GESUNDHEITS-NUTZEN
        </AppText>
      </View>

      <Row
        label="Ausdauer"
        value={`${Math.min(benefit.aerobicMinutes, 999)} / ${WHO_AEROBIC_MINUTES} Min.`}
        progress={benefit.aerobicMinutes / WHO_AEROBIC_MINUTES}
        done={benefit.aerobicMet}
      />
      <Row
        label="Kraft"
        value={`${benefit.strengthDays} / ${WHO_STRENGTH_DAYS} Tage`}
        progress={benefit.strengthDays / WHO_STRENGTH_DAYS}
        done={benefit.strengthMet}
      />

      <AppText color={both ? 'accent' : 'text'}>{benefitMessage(benefit)}</AppText>

      {showLastWeek ? (
        <View style={[styles.lastWeek, { borderTopColor: theme.border }]}>
          <Ionicons
            name={lastWeek.aerobicMet && lastWeek.strengthMet ? 'checkmark-circle' : 'time-outline'}
            size={16}
            color={theme.accent}
          />
          <AppText variant="caption" color="textSecondary" style={styles.flex}>
            Letzte Woche: {lastWeek.aerobicMinutes} Ausdauer-Min. · {lastWeek.strengthDays}{' '}
            {lastWeek.strengthDays === 1 ? 'Krafttag' : 'Krafttage'}
            {lastWeek.aerobicMet && lastWeek.strengthMet ? ' · WHO-Empfehlung erfüllt' : ''}
          </AppText>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        hitSlop={8}
        style={styles.more}>
        <AppText variant="label" color="accent">
          {open ? 'Weniger' : 'Warum gerade diese Werte?'}
        </AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.accent} />
      </Pressable>
      {open ? (
        <AppText variant="caption" color="textSecondary">
          Die Weltgesundheitsorganisation empfiehlt Erwachsenen pro Woche mindestens 150 Minuten moderate oder 75 Minuten
          intensive Ausdauer, dazu an 2 Tagen Krafttraining. Eine Laufminute zählt deshalb doppelt. In einer Studie mit
          rund 480.000 Erwachsenen (Zhao et al., BMJ 2020) hatten Menschen, die beides erfüllten, ein um etwa 40 %
          geringeres Sterberisiko als Inaktive. Das ist ein Zusammenhang aus Beobachtungsdaten, kein Versprechen, aber
          der beste Richtwert, den es gibt.
          {metWeeks > 0 ? `\n\nDu hast die Empfehlung in ${metWeeks} der letzten 12 Wochen erfüllt.` : ''}
        </AppText>
      ) : null}
    </Card>
  );
}

function Row({ label, value, progress, done }: { label: string; value: string; progress: number; done: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <AppText variant="heading" style={styles.flex}>
          {label}
        </AppText>
        {done ? <Ionicons name="checkmark-circle" size={18} color={theme.accent} /> : null}
        <AppText color="textSecondary">{value}</AppText>
      </View>
      <ProgressBar progress={Math.min(1, progress)} height={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  row: { gap: Spacing.one },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  more: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  lastWeek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
