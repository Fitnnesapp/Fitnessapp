import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PremiumPrompt } from '@/components/premium-prompt';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { OnImage, Spacing } from '@/constants/theme';
import { sceneForProgramCategory } from '@/data/images';
import { getProgram, isFreeProgram } from '@/data/programs';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { impactFeedback } from '@/lib/haptics';
import { exerciseCount, programMinutes } from '@/lib/logic/timeline';

export default function ProgramDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = getProgram(id);
  const { isPremium } = useSubscription();

  if (!program) {
    return (
      <Screen>
        <AppText variant="title">Programm nicht gefunden</AppText>
      </Screen>
    );
  }

  const stats = [
    { label: 'Minuten', value: String(programMinutes(program)) },
    { label: 'Übungen', value: String(exerciseCount(program)) },
    { label: program.rounds === 1 ? 'Runde' : 'Runden', value: String(program.rounds) },
  ];

  return (
    <Screen>
      <FadeIn>
        <ImageCard source={sceneForProgramCategory(program.category)} height={240} accessibilityLabel={program.name}>
          <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
            {program.category} · {program.difficulty}
          </AppText>
          <AppText variant="display" style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
            {program.name}
          </AppText>
          <AppText style={styles.onImageSoft}>{program.description}</AppText>
        </ImageCard>
      </FadeIn>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <Card key={stat.label} style={styles.stat}>
            <AppText variant="number" style={styles.statValue}>
              {stat.value}
            </AppText>
            <AppText variant="eyebrow" color="textSecondary">
              {stat.label}
            </AppText>
          </Card>
        ))}
      </View>

      <AppText variant="caption" color="textSecondary">
        {program.workSeconds} s Belastung, {program.restSeconds} s Pause
        {program.rounds > 1 ? `, ${program.rounds} Runden` : ''}. Signaltöne bei jedem Wechsel, du musst nicht auf den
        Bildschirm schauen.
      </AppText>

      {isPremium || isFreeProgram(program.id) ? (
        <Button
          title="Starten"
          onPress={() => {
            impactFeedback();
            router.push({ pathname: '/training/player/[id]', params: { id: program.id } });
          }}
        />
      ) : (
        <PremiumPrompt
          title="Premium-Programm"
          text="Dieses Programm gehört zur vollen Bibliothek. Mit Premium stehen dir alle Programme offen, dazu gibt es eine kostenlose Testwoche."
        />
      )}

      <AppText variant="heading" style={styles.section}>
        Ablauf {program.rounds > 1 ? `(je Runde)` : ''}
      </AppText>
      {program.steps.map((step, index) => (
        <Card key={step.name + index} style={styles.row}>
          <View style={[styles.index, { backgroundColor: theme.surfaceAlt }]}>
            <AppText variant="label">{index + 1}</AppText>
          </View>
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <AppText variant="heading" style={styles.flex}>
                {step.name}
              </AppText>
              <AppText variant="caption" color="accent">
                {step.seconds ?? program.workSeconds} s
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary">
              {step.instruction}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '900' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.85 },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center', padding: Spacing.three, gap: 2 },
  statValue: { fontSize: 26, lineHeight: 30 },
  section: { marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, paddingVertical: Spacing.three },
  index: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  flex: { flex: 1, gap: 2 },
});
