import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayKey } from '@/lib/logic/activity';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_FORMAT = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

type MonthCalendarProps = {
  /** Kalendertage (yyyy-mm-dd), an denen trainiert wurde, mit Anzahl */
  counts: Map<string, number>;
  selected: string | null;
  onSelect: (key: string | null) => void;
};

/** Monatsansicht mit markierten Trainingstagen. Ein Tipp auf einen Tag wählt ihn, ein zweiter hebt die Auswahl auf. */
export function MonthCalendar({ counts, selected, onSelect }: MonthCalendarProps) {
  const theme = useTheme();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const [todayKey] = useState(() => dayKey(Date.now()));

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voriger Monat" onPress={() => setMonth(new Date(year, m - 1, 1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <AppText variant="heading">{MONTH_FORMAT.format(month)}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={() => setMonth(new Date(year, m + 1, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <AppText variant="caption" color="textSecondary">
              {d}
            </AppText>
          </View>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;

          const key = dayKey(new Date(year, m, day).getTime());
          const count = counts.get(key) ?? 0;
          const isSelected = selected === key;

          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${day}. ${MONTH_FORMAT.format(month)}${count ? `, ${count} Workouts` : ''}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(isSelected ? null : key)}
              style={styles.cell}>
              <View
                style={[
                  styles.day,
                  {
                    backgroundColor: isSelected ? theme.accent : count > 0 ? theme.surfaceAlt : 'transparent',
                    borderColor: key === todayKey ? theme.text : 'transparent',
                  },
                ]}>
                <AppText variant="caption" style={{ color: isSelected ? theme.onAccent : theme.text }}>
                  {day}
                </AppText>
                {count > 0 && !isSelected ? <View style={[styles.mark, { backgroundColor: theme.accent }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: 3 },
});
