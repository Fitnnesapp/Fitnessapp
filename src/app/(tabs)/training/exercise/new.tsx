import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MuscleMap } from '@/components/muscle-map';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { EQUIPMENT, MUSCLE_GROUPS } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { successFeedback } from '@/lib/haptics';
import { CUSTOM_EXERCISE_LIMITS } from '@/lib/logic/custom-exercises';
import { useCustomExercises } from '@/lib/storage/custom-exercise-store';
import { useWorkouts } from '@/lib/storage/workout-store';
import type { Equipment, MuscleGroup } from '@/types/workout';

/**
 * Eigene Übung anlegen. Aus der Auswahl im Workout heraus (pick/swap) landet sie
 * direkt im laufenden Workout, sonst öffnet sich ihre Detailseite.
 */
export default function NewExerciseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ pick?: string; swap?: string; name?: string }>();
  const add = useCustomExercises((state) => state.add);
  const addExercise = useWorkouts((state) => state.addExercise);
  const replaceExercise = useWorkouts((state) => state.replaceExercise);
  const hasActive = useWorkouts((state) => state.active !== null);

  const [name, setName] = useState(params.name ?? '');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const swapIndex = params.swap !== undefined ? Number(params.swap) : null;
  const intoWorkout = hasActive && (params.pick === '1' || (swapIndex !== null && Number.isInteger(swapIndex)));

  function save() {
    if (!muscle || !equipment) {
      setError('Wähle Muskelgruppe und Equipment.');
      return;
    }
    const result = add({ name, muscleGroup: muscle, equipment, instructions: notes });
    if ('error' in result) {
      setError(result.error);
      return;
    }
    successFeedback();
    if (intoWorkout) {
      if (swapIndex !== null && Number.isInteger(swapIndex)) replaceExercise(swapIndex, result.id);
      else addExercise(result.id);
      // Anlegen und Auswahl schließen, zurück ins laufende Workout
      router.dismissTo('/training/workout');
      return;
    }
    router.replace({ pathname: '/training/exercise/[id]', params: { id: result.id } });
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        Eigene Übung
      </AppText>
      <AppText color="textSecondary">
        Fehlt ein Gerät aus deinem Studio oder eine Variante? Leg sie an. Sie zählt danach wie jede andere Übung: Rekorde,
        Fortschritt, Ziele und Muskelanalyse.
      </AppText>

      <Card style={styles.card}>
        <TextField
          label="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          placeholder="z.B. Brustpresse am Hammer-Gerät"
          maxLength={CUSTOM_EXERCISE_LIMITS.nameMax}
          autoFocus={!params.name}
        />

        <AppText variant="label" color="textSecondary">
          HAUPTMUSKEL
        </AppText>
        <View style={styles.mapWrap}>
          <MuscleMap
            load={muscle ? { [muscle]: 1 } : {}}
            height={140}
            showLegend={false}
            onSelectMuscle={(group) => {
              setMuscle(group);
              setError(null);
            }}
          />
        </View>
        <View style={styles.chips}>
          {MUSCLE_GROUPS.map((group) => (
            <Chip
              key={group}
              label={group}
              selected={muscle === group}
              onPress={() => {
                setMuscle(group);
                setError(null);
              }}
            />
          ))}
        </View>

        <AppText variant="label" color="textSecondary">
          EQUIPMENT
        </AppText>
        <View style={styles.chips}>
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={equipment === item}
              onPress={() => {
                setEquipment(item);
                setError(null);
              }}
            />
          ))}
        </View>

        <TextField
          label="Notiz zur Ausführung (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="z.B. Sitz auf Stufe 4, enger Griff"
          maxLength={CUSTOM_EXERCISE_LIMITS.notesMax}
          multiline
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

      <Button title={intoWorkout ? 'Anlegen und hinzufügen' : 'Übung anlegen'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  card: { gap: Spacing.three },
  mapWrap: { alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium },
  flex: { flex: 1 },
});
