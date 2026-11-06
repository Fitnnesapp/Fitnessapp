import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { moveInTemplate, removeFromTemplate, TEMPLATE_MAX_EXERCISES } from '@/lib/logic/templates';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Vorlage bearbeiten: Name, Übungen hinzufügen, entfernen und umsortieren. Jede Änderung wird sofort gespeichert. */
export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const template = useWorkouts((state) => state.templates.find((t) => t.id === id));
  const active = useWorkouts((state) => state.active);
  const renameTemplate = useWorkouts((state) => state.renameTemplate);
  const setTemplateExercises = useWorkouts((state) => state.setTemplateExercises);
  const deleteTemplate = useWorkouts((state) => state.deleteTemplate);
  const startWorkout = useWorkouts((state) => state.startWorkout);
  const [name, setName] = useState(template?.name ?? '');

  // Eine Vorlage, die ohne Übungen verlassen wird, wäre nur eine leere Karte: beim Verlassen entfernen
  useEffect(
    () => () => {
      const state = useWorkouts.getState();
      const current = state.templates.find((t) => t.id === id);
      if (current && current.exerciseIds.length === 0) state.deleteTemplate(current.id);
    },
    [id],
  );

  if (!template) {
    return (
      <Screen>
        <AppText variant="title">Vorlage nicht gefunden</AppText>
        <Button title="Zu Kraft" variant="secondary" onPress={() => router.replace('/training/strength')} />
      </Screen>
    );
  }

  const ids = template.exerciseIds;
  const full = ids.length >= TEMPLATE_MAX_EXERCISES;

  return (
    <Screen>
      <TextField
        label="Name der Vorlage"
        value={name}
        onChangeText={setName}
        onBlur={() => (name.trim() ? renameTemplate(template.id, name) : setName(template.name))}
        onSubmitEditing={() => name.trim() && renameTemplate(template.id, name)}
        maxLength={40}
      />

      <AppText variant="label" color="textSecondary">
        ÜBUNGEN ({ids.length})
      </AppText>
      {ids.length === 0 ? (
        <Card>
          <AppText color="textSecondary">Noch leer. Füge die Übungen hinzu, die du regelmäßig zusammen trainierst.</AppText>
        </Card>
      ) : null}
      {ids.map((exerciseId, index) => {
        const exercise = getExercise(exerciseId);
        const label = exercise?.name ?? exerciseId;
        return (
          <Card key={exerciseId} style={styles.row}>
            <AppText variant="label" color="textSecondary" style={styles.index}>
              {index + 1}
            </AppText>
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={2}>
                {label}
              </AppText>
              {exercise ? (
                <AppText variant="caption" color="textSecondary">
                  {exercise.muscleGroup} · {exercise.equipment}
                </AppText>
              ) : null}
            </View>
            <IconButton
              icon="arrow-up"
              label={`${label} nach oben`}
              disabled={index === 0}
              onPress={() => setTemplateExercises(template.id, moveInTemplate(ids, index, -1))}
            />
            <IconButton
              icon="arrow-down"
              label={`${label} nach unten`}
              disabled={index === ids.length - 1}
              onPress={() => setTemplateExercises(template.id, moveInTemplate(ids, index, 1))}
            />
            <IconButton
              icon="close"
              label={`${label} entfernen`}
              onPress={() => setTemplateExercises(template.id, removeFromTemplate(ids, index))}
            />
          </Card>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Übung zur Vorlage hinzufügen"
        disabled={full}
        onPress={() => router.push({ pathname: '/training/exercises', params: { template: template.id } })}
        style={({ pressed }) => [
          styles.add,
          { borderColor: theme.border, opacity: full ? 0.5 : 1 },
          pressed && styles.pressed,
        ]}>
        <Ionicons name="add" size={20} color={theme.accent} />
        <AppText variant="label" color="accent">
          {full ? `Höchstens ${TEMPLATE_MAX_EXERCISES} Übungen` : 'Übung hinzufügen'}
        </AppText>
      </Pressable>

      <Button
        title={active ? 'Es läuft schon ein Workout' : 'Vorlage starten'}
        disabled={active !== null || ids.length === 0}
        onPress={() => {
          startWorkout(ids);
          router.replace('/training/workout');
        }}
      />
      <Button
        title="Vorlage löschen"
        variant="danger"
        onPress={() =>
          confirmAction({
            title: 'Vorlage löschen?',
            message: `„${template.name}“ wird entfernt. Bereits gespeicherte Workouts bleiben erhalten.`,
            confirmLabel: 'Löschen',
            onConfirm: () => {
              deleteTemplate(template.id);
              if (router.canGoBack()) router.back();
              else router.replace('/training/strength');
            },
          })
        }
      />
    </Screen>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: 'arrow-up' | 'arrow-down' | 'close';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.surfaceAlt, opacity: disabled ? 0.35 : 1 },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={18} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  index: { width: 18 },
  flex: { flex: 1 },
  iconButton: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pressed: { opacity: 0.6 },
});
