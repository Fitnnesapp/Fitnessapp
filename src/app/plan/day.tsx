import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { FREE_PROGRAM_IDS, PROGRAMS } from '@/data/programs';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { sessionTemplates, setDaySessions, WEEKDAY_NAMES, type SessionTemplate } from '@/lib/logic/plan';
import { usePlanStore } from '@/lib/storage/plan-store';

/** Einen Wochentag selbst belegen: Haupteinheit, optionale zweite Einheit oder Ruhetag. */
export default function PlanDayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const { isPremium } = useSubscription();
  const plan = usePlanStore((state) => state.plan);
  const setPlan = usePlanStore((state) => state.setPlan);
  const { d } = useLocalSearchParams<{ d: string }>();
  const day = Math.max(0, Math.min(6, Number(d) || 0));

  const templates = useMemo(
    () =>
      plan
        ? sessionTemplates(plan.answers, {
            allowedProgramIds: isPremium ? PROGRAMS.map((p) => p.id) : FREE_PROGRAM_IDS,
            programs: PROGRAMS,
            now,
            startNextMonday: false,
          })
        : [],
    [plan, isPremium, now],
  );

  // Vorauswahl: die bisherigen Einheiten des Tages, über den Titel wiedergefunden
  const initial = useMemo(() => {
    if (!plan) return [];
    return plan.sessions
      .filter((s) => s.day === day)
      .map((s) => templates.find((t) => t.session.title === s.title)?.key)
      .filter((k): k is string => !!k);
  }, [plan, day, templates]);

  const [chosen, setChosen] = useState<string[] | null>(null);
  const selection = chosen ?? initial;

  if (!plan) return <Redirect href="/plan" />;

  function toggle(key: string) {
    if (selection.includes(key)) setChosen(selection.filter((k) => k !== key));
    else setChosen(selection.length >= 2 ? [selection[0], key] : [...selection, key]);
  }

  function save() {
    if (!plan) return;
    const picked = selection.map((key) => templates.find((t) => t.key === key)).filter((t): t is SessionTemplate => !!t);
    setPlan(setDaySessions(plan, day, picked));
    router.back();
  }

  const groups = [...new Set(templates.map((t) => t.group))];

  return (
    <Screen>
      <Stack.Screen options={{ title: WEEKDAY_NAMES[day] }} />
      <AppText color="textSecondary">
        Wähle bis zu zwei Einheiten. Die erste ist die Haupteinheit, die zweite wird eine kurze Zusatzeinheit. Ohne
        Auswahl ist der Tag ein Ruhetag.
      </AppText>

      {groups.map((group) => (
        <View key={group} style={styles.group}>
          <AppText variant="label" color="textSecondary">
            {group.toUpperCase()}
          </AppText>
          {templates
            .filter((t) => t.group === group)
            .map((t) => {
              const position = selection.indexOf(t.key);
              const selected = position >= 0;
              return (
                <Pressable
                  key={t.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggle(t.key)}
                  style={[
                    styles.option,
                    { backgroundColor: selected ? theme.accentSoft : theme.surface, borderColor: selected ? theme.accent : theme.border },
                  ]}>
                  <View style={styles.flex}>
                    <AppText variant="heading">{t.session.title}</AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                      {t.session.detail}
                    </AppText>
                  </View>
                  {selected ? (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                      <AppText variant="label" style={{ color: theme.onAccent }}>
                        {position === 0 ? '1' : '2'}
                      </AppText>
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color={theme.border} />
                  )}
                </Pressable>
              );
            })}
        </View>
      ))}

      <View style={styles.footer}>
        <Button title={selection.length === 0 ? 'Als Ruhetag speichern' : 'Tag speichern'} onPress={save} />
        <Button title="Abbrechen" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  group: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 2,
  },
  badge: { width: 28, height: 28, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: Spacing.two },
});
