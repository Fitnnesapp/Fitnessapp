import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useSearchIndex, type SearchEntry } from '@/hooks/use-search-index';
import { useTheme } from '@/hooks/use-theme';
import { search, type SearchKind } from '@/lib/logic/search';

const KIND_LABEL: Record<SearchKind, string> = {
  funktion: 'Funktionen',
  uebung: 'Übungen',
  programm: 'Home-Programme',
  challenge: 'Challenges',
  event: 'Events',
};

const KIND_ICON: Record<SearchKind, keyof typeof Ionicons.glyphMap> = {
  funktion: 'apps',
  uebung: 'barbell',
  programm: 'body',
  challenge: 'trophy',
  event: 'calendar',
};

const KIND_ORDER: SearchKind[] = ['funktion', 'challenge', 'programm', 'uebung', 'event'];

const EXAMPLES = ['Winter Arc', 'Plan ändern', 'Übungen für den Rücken', 'Joggen', 'Daten löschen', 'Marathon'];

/** Suche über alle Funktionen und Inhalte. Läuft komplett auf dem Gerät. */
export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const index = useSearchIndex();
  const [query, setQuery] = useState('');

  const results = useMemo(() => search(index, query, 30), [index, query]);
  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchEntry[]>();
    for (const r of results) map.set(r.item.kind, [...(map.get(r.item.kind) ?? []), r.item]);
    return KIND_ORDER.filter((k) => map.has(k)).map((k) => ({ kind: k, items: (map.get(k) ?? []).slice(0, 6) }));
  }, [results]);
  const best = results[0]?.item;

  function open(entry: SearchEntry) {
    if ('url' in entry.target) {
      void Linking.openURL(entry.target.url);
      return;
    }
    // Suche schließen und das Ziel öffnen
    router.back();
    router.push(entry.target.href);
  }

  return (
    <Screen topInset scroll={false} contentStyle={styles.screen}>
      <View style={styles.top}>
        <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
          <Ionicons name="sparkles" size={18} color={theme.accent} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Frag einfach: Wie ändere ich meinen Plan?"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.accent}
            returnKeyType="search"
            onSubmitEditing={() => (best ? open(best) : undefined)}
            accessibilityLabel="Suche"
            style={[styles.input, { color: theme.text }]}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Eingabe löschen" onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
          <AppText variant="label" color="accent">
            Fertig
          </AppText>
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {query.trim() === '' ? (
          <>
            <AppText variant="caption" color="textSecondary">
              Suche nach Funktionen, Übungen, Programmen, Challenges und Events. Du kannst auch ganze Fragen stellen,
              Tippfehler sind kein Problem.
            </AppText>
            <View style={styles.chips}>
              {EXAMPLES.map((e) => (
                <Chip key={e} label={e} selected={false} onPress={() => setQuery(e)} />
              ))}
            </View>
          </>
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={32} color={theme.textSecondary} />
            <AppText variant="heading">Nichts gefunden</AppText>
            <AppText color="textSecondary" style={styles.center}>
              Probier ein anderes Wort, z. B. „Laufen“, „Plan“ oder eine Muskelgruppe wie „Brust“.
            </AppText>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.kind} style={styles.group}>
              <AppText variant="label" color="textSecondary">
                {KIND_LABEL[group.kind].toUpperCase()}
              </AppText>
              {group.items.map((item) => {
                const isBest = item === best;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => open(item)}
                    style={({ pressed }) => [
                      styles.result,
                      {
                        backgroundColor: isBest ? theme.accentSoft : theme.surface,
                        borderColor: isBest ? theme.accent : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.icon, { backgroundColor: isBest ? theme.accent : theme.surfaceAlt }]}>
                      <Ionicons name={KIND_ICON[item.kind]} size={18} color={isBest ? theme.onAccent : theme.text} />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="heading" numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                        {item.subtitle}
                      </AppText>
                    </View>
                    <Ionicons
                      name={'url' in item.target ? 'open-outline' : 'chevron-forward'}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  screen: { gap: Spacing.three },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 50,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  // Im Browser keinen zusätzlichen Fokusrahmen, der Rahmen des Feldes zeigt den Fokus schon
  input: { flex: 1, fontSize: 16, minHeight: 46, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null) },
  body: { gap: Spacing.four, paddingBottom: Spacing.five },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five },
  group: { gap: Spacing.two },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  pressed: { opacity: 0.75 },
  icon: { width: 36, height: 36, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
});
