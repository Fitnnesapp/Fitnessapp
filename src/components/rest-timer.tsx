import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { formatClock } from '@/lib/logic/format';

const PRESETS = [60, 90, 120, 180];

type RestTimerProps = {
  /** Zeitpunkt (ms), zu dem die Pause endet. null = kein Timer aktiv. */
  endsAt: number | null;
  onChangeEnd: (endsAt: number | null) => void;
  duration: number;
  onChangeDuration: (seconds: number) => void;
};

export function RestTimer({ endsAt, onChangeEnd, duration, onChangeDuration }: RestTimerProps) {
  const theme = useTheme();
  const running = endsAt !== null;
  const now = useNow(250, running);
  const remaining = running ? Math.max(0, endsAt - now) : 0;
  const vibratedFor = useRef<number | null>(null);

  useEffect(() => {
    // Beim Ablauf einmal pro Pause vibrieren
    if (running && remaining === 0 && vibratedFor.current !== endsAt) {
      vibratedFor.current = endsAt;
      Vibration.vibrate([0, 300, 150, 300]);
    }
  }, [running, remaining, endsAt]);

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.top}>
        <AppText variant="label" color="textSecondary">
          {running && remaining > 0 ? 'PAUSE' : running ? 'PAUSE VORBEI' : 'RUHEZEIT'}
        </AppText>
        {running ? (
          <AppText variant="title" color={remaining > 0 ? 'accent' : 'success'}>
            {formatClock(remaining)}
          </AppText>
        ) : null}
      </View>

      {running ? (
        <View style={styles.actions}>
          <TimerButton label="-15 s" onPress={() => onChangeEnd(endsAt - 15000)} />
          <TimerButton label="+15 s" onPress={() => onChangeEnd(endsAt + 15000)} />
          <TimerButton label={remaining > 0 ? 'Überspringen' : 'Schließen'} onPress={() => onChangeEnd(null)} />
        </View>
      ) : (
        <View style={styles.actions}>
          {PRESETS.map((seconds) => (
            <TimerButton
              key={seconds}
              label={`${seconds} s`}
              selected={seconds === duration}
              onPress={() => onChangeDuration(seconds)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function TimerButton({ label, onPress, selected }: { label: string; onPress: () => void; selected?: boolean }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.button,
        { borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.surfaceAlt : 'transparent' },
      ]}>
      <AppText variant="label" color={selected ? 'accent' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: Radius.large, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
