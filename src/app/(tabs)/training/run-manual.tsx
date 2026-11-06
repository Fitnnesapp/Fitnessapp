import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { successFeedback } from '@/lib/haptics';
import {
  calendarDaysAgo,
  parseDuration,
  startFromDayAndTime,
  timeOfDay,
  validateManualRun,
} from '@/lib/logic/manual-run';
import { formatRaceTime } from '@/lib/logic/run-insights';
import { formatPace, paceUnitLabel, parseNumber } from '@/lib/logic/units';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';

const KM_PER_MILE = 1.609344;
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function dayLabel(daysAgo: number, now: number): string {
  if (daysAgo === 0) return 'Heute';
  if (daysAgo === 1) return 'Gestern';
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}.`;
}

/** Lauf ohne GPS nachtragen, z.B. vom Laufband oder wenn das Handy zu Hause lag. */
export default function ManualRunScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const addManualRun = useRunStore((state) => state.addManualRun);
  const [now] = useState(() => Date.now());
  // Bearbeiten: nur nachgetragene Läufe, Felder mit den gespeicherten Werten vorbelegt
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const updateManualRun = useRunStore((state) => state.updateManualRun);
  const editing = useRunStore((state) => state.history.find((run) => run.id === edit && run.manual));
  const [initial] = useState(() =>
    editing
      ? {
          distance: String(
            Math.round((editing.distanceM / (units === 'metric' ? 1000 : KM_PER_MILE * 1000)) * 100) / 100,
          ).replace('.', ','),
          duration: formatRaceTime(editing.durationSeconds),
          daysAgo: calendarDaysAgo(editing.startedAt, now),
          time: timeOfDay(editing.startedAt),
        }
      : null,
  );

  const [distanceText, setDistanceText] = useState(initial?.distance ?? '');
  const [durationText, setDurationText] = useState(initial?.duration ?? '');
  const [daysAgo, setDaysAgo] = useState(initial?.daysAgo ?? 0);
  const [timeText, setTimeText] = useState(initial?.time ?? '');
  // Tage zur Auswahl: die letzte Woche, beim Bearbeiten auch ein älterer gespeicherter Tag
  const dayOptions = [0, 1, 2, 3, 4, 5, 6, ...(initial && initial.daysAgo > 6 ? [initial.daysAgo] : [])];
  const [error, setError] = useState<string | null>(null);

  const distanceValue = parseNumber(distanceText);
  const distanceKm = distanceValue !== null ? (units === 'metric' ? distanceValue : distanceValue * KM_PER_MILE) : null;
  const durationSeconds = parseDuration(durationText);
  const pace = distanceKm && durationSeconds ? durationSeconds / distanceKm : null;
  const unit = units === 'metric' ? 'km' : 'mi';

  function startedAt(): number | null {
    if (timeText.trim()) return startFromDayAndTime(now, daysAgo, timeText);
    // Ohne Uhrzeit: heute gerade eben beendet, an früheren Tagen am frühen Abend
    if (daysAgo === 0) return durationSeconds ? Date.now() - durationSeconds * 1000 : null;
    return startFromDayAndTime(now, daysAgo, '18:00');
  }

  function save() {
    if (distanceKm === null) return setError('Gib eine Distanz an, z.B. 5 oder 5,2.');
    if (durationSeconds === null) return setError('Gib die Dauer an, z.B. 28:30 oder 1:05:00.');
    const start = startedAt();
    if (start === null) return setError('Die Uhrzeit bitte als HH:MM, z.B. 07:30.');
    const input = { distanceKm, durationSeconds, startedAt: start };
    const problem = validateManualRun(input, Date.now());
    if (problem) return setError(problem);
    successFeedback();
    if (editing) {
      updateManualRun(editing.id, input);
      // Das Formular liegt im Training-Stapel, die Details im Verlauf: dorthin zurück, nicht auf die vorige Trainingsseite
      router.replace({ pathname: '/history/[id]', params: { id: editing.id } });
      return;
    }
    const id = addManualRun(input);
    router.replace({ pathname: '/history/[id]', params: { id } });
  }

  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setError(null);
  };

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        {editing ? 'Lauf bearbeiten' : 'Lauf nachtragen'}
      </AppText>
      <AppText color="textSecondary">
        Laufband, Handy vergessen oder mit einer Uhr gelaufen? Trag Distanz und Zeit ein. Der Lauf zählt für Verlauf,
        Wochenziel, Challenges und deine Prognose.
      </AppText>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label={`Distanz (${unit})`}
              value={distanceText}
              onChangeText={change(setDistanceText)}
              placeholder="5,0"
              keyboardType="decimal-pad"
              autoFocus={!editing}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Dauer"
              value={durationText}
              onChangeText={change(setDurationText)}
              placeholder="28:30"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View style={[styles.pace, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="speedometer-outline" size={18} color={theme.accent} />
          <AppText variant="caption" color="textSecondary">
            Ø Pace
          </AppText>
          <AppText variant="heading">{pace ? `${formatPace(pace, units)} ${paceUnitLabel(units)}` : '–'}</AppText>
        </View>

        <AppText variant="label" color="textSecondary">
          WANN?
        </AppText>
        <View style={styles.chips}>
          {dayOptions.map((index) => (
            <Chip
              key={index}
              label={dayLabel(index, now)}
              selected={daysAgo === index}
              onPress={() => {
                setDaysAgo(index);
                setError(null);
              }}
            />
          ))}
        </View>
        <TextField
          label="Startzeit (optional)"
          value={timeText}
          onChangeText={change(setTimeText)}
          placeholder={daysAgo === 0 ? 'gerade eben beendet' : '18:00'}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      </Card>

      {error ? (
        <View style={[styles.note, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="alert-circle" size={18} color={theme.danger} />
          <AppText color="danger" accessibilityRole="alert" style={styles.flex}>
            {error}
          </AppText>
        </View>
      ) : null}

      <Button title={editing ? 'Änderungen speichern' : 'Lauf speichern'} onPress={save} />
      <AppText variant="caption" color="textSecondary">
        Ohne GPS gibt es keine Strecke und keine Kilometerzeiten. Bestzeiten über 1, 5 und 10 km kommen deshalb nur aus
        aufgezeichneten Läufen.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  card: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium },
});
