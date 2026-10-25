import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChallengeCard } from '@/components/challenge-card';
import { EventCard } from '@/components/event-card';
import { FeedCard } from '@/components/feed-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageCard } from '@/components/ui/image-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { sceneForKind } from '@/data/images';
import { getProgram } from '@/data/programs';
import { useActivities } from '@/hooks/use-activities';
import { useBadgeContext } from '@/hooks/use-badge-context';
import { useChallenges } from '@/hooks/use-challenges';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { FREEZES_PER_MONTH, streaks, weekStart, weekStats } from '@/lib/logic/activity';
import { BADGES } from '@/lib/logic/badges';
import { daysUntilEvent, upcomingEvents } from '@/lib/logic/events';
import { buildFeed } from '@/lib/logic/feed';
import { compareWithLastWeek, trainingIdentity } from '@/lib/logic/identity';
import { dayHeading, greeting, nextBadge, WEEKLY_GOAL_DAYS, weeklyGoal } from '@/lib/logic/motivation';
import { missedLastPlanned, nextSession, plannedDaysThisWeek, sessionsForDay, WEEKDAY_NAMES } from '@/lib/logic/plan';
import { suggestWorkout, type SuggestionTarget } from '@/lib/logic/suggestions';
import type { Units } from '@/lib/logic/units';
import { hrefForSession } from '@/lib/plan-href';
import { useEvents, useEventsStore } from '@/lib/storage/events-store';
import { useGamification } from '@/lib/storage/gamification-store';
import { useHomeSessions } from '@/lib/storage/home-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Hero = {
  label: string;
  title: string;
  text: string;
  href: Href | null;
  cta: string;
  note: string;
  kind: 'strength' | 'run' | 'program' | 'rest';
};

function hrefFor(target: SuggestionTarget): Href {
  if (target.kind === 'strength') return '/training/strength';
  if (target.kind === 'run') return '/training/running';
  return { pathname: '/training/program/[id]', params: { id: target.programId } };
}

const DAYS = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];

/** Zeit als große Zahl: unter einer Stunde in Minuten, sonst h:mm. */
function durationParts(seconds: number): { value: string; unit: string } {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return { value: String(minutes), unit: 'Min' };
  return { value: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`, unit: 'Std' };
}

function distanceParts(meters: number, units: Units): { value: string; unit: string } {
  const value = units === 'metric' ? meters / 1000 : meters / 1609.344;
  return { value: value.toFixed(1).replace('.', ','), unit: units === 'metric' ? 'km' : 'mi' };
}

/** Ganze Zahlen ohne Nachkommastellen, Kilometer mit einer. */
function formatProgress(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

/**
 * Start-Bildschirm (Redesign 2.0, sportlich-kraftvoll). Aufbau entlang der Gewohnheitsschleife:
 * 1. Identität und Begrüßung, 2. genau eine nächste Handlung, 3. sichtbarer Fortschritt der Woche
 *    mit Serie und fairem Vergleich zur Vorwoche, 4. eigene Aktivitäten, 5. nahe Ziele.
 * Begründung und Quellen: docs/design-psychologie.md
 */
export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const name = useSettings((state) => state.displayName).trim();
  const activities = useActivities();
  const now = useNow(60_000);
  const strengthHistory = useWorkouts((state) => state.history);
  const homeSessions = useHomeSessions((state) => state.sessions);
  const runHistory = useRunStore((state) => state.history);
  const earned = useGamification((state) => state.earned);
  const unseen = useGamification((state) => state.unseen);
  const markSeen = useGamification((state) => state.markSeen);
  const badgeContext = useBadgeContext();
  const plan = usePlanStore((state) => state.plan);
  const { entries: challengeEntries } = useChallenges();
  const events = useEvents();
  const refreshEvents = useEventsStore((state) => state.refresh);
  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  // Ankündigung: das nächste Event der kommenden zwei Wochen
  const nextEvent = useMemo(() => upcomingEvents(events, now, 1).find((e) => daysUntilEvent(e, now) <= 14), [events, now]);
  // Eine Challenge: die eigene, sonst eine laufende als Einladung
  const featuredChallenge =
    challengeEntries.find((e) => e.joined && !e.progress?.completed) ??
    challengeEntries.find((e) => !e.joined && e.challenge.window.kind === 'fixed');

  const week = useMemo(() => weekStats(activities, weekStart(now)), [activities, now]);
  const goal = useMemo(
    () => weeklyGoal(week.perDay, plan ? Math.max(1, plannedDaysThisWeek(plan, weekStart(now))) : WEEKLY_GOAL_DAYS),
    [week, plan, now],
  );
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const identity = useMemo(() => trainingIdentity(activities, now), [activities, now]);
  const comparison = useMemo(() => compareWithLastWeek(activities, now), [activities, now]);
  const upcoming = useMemo(() => nextBadge(badgeContext, earned), [badgeContext, earned]);
  const upcomingBadge = upcoming ? BADGES.find((b) => b.key === upcoming.key) : undefined;
  const suggestion = useMemo(
    () => suggestWorkout({ activities, strength: strengthHistory, now, muscleGroupOf: (id) => getExercise(id)?.muscleGroup }),
    [activities, strengthHistory, now],
  );
  const feed = useMemo(
    () =>
      buildFeed({
        strength: strengthHistory,
        home: homeSessions,
        runs: runHistory,
        muscleGroupOf: (id) => getExercise(id)?.muscleGroup,
        programName: (id) => getProgram(id)?.name,
      }),
    [strengthHistory, homeSessions, runHistory],
  );
  const today = (new Date(now).getDay() + 6) % 7;
  const time = durationParts(week.durationSeconds);
  const distance = distanceParts(week.distanceM, units);

  // Genau eine nächste Handlung: mit Plan die heutige Einheit, sonst der regelbasierte Vorschlag
  const hero = useMemo((): Hero => {
    if (!plan) {
      return {
        label: 'Heute für dich',
        title: suggestion.title,
        text: suggestion.reason,
        href: suggestion.target ? hrefFor(suggestion.target) : null,
        cta: "Los geht's",
        note: 'Aus einfachen Regeln, keine KI',
        kind: suggestion.target?.kind ?? 'rest',
      };
    }
    const [session, extra] = sessionsForDay(plan, now);
    if (session && !streak.trainedToday) {
      const comeback = missedLastPlanned(plan, activities, now);
      return {
        label: comeback ? 'Comeback-Tag' : 'Heute in deinem Plan',
        title: session.title,
        text: comeback
          ? 'Die letzte Einheit ist ausgefallen. Kein Problem: Entscheidend ist, dass du heute wieder einsteigst.'
          : session.detail,
        href: hrefForSession(session),
        cta: `Los geht's · ${session.minutes} Min`,
        note: extra ? `Danach: ${extra.minutes} Min ${extra.title}` : 'Dein Plan, deine Zeit',
        kind: session.kind,
      };
    }
    const upcomingSession = nextSession(plan, now);
    const when = upcomingSession ? (upcomingSession.inDays === 1 ? 'Morgen' : WEEKDAY_NAMES[upcomingSession.session.day]) : null;
    return {
      label: session ? 'Heute erledigt' : now < plan.startsAt ? 'Dein Plan startet bald' : 'Ruhetag laut Plan',
      title: session ? 'Stark, Einheit geschafft' : now < plan.startsAt ? `Start am ${dayHeading(plan.startsAt)}` : 'Heute ist Erholung dran',
      text: upcomingSession ? `${when}: ${upcomingSession.session.title}` : 'Erholung gehört zum Training.',
      href: null,
      cta: '',
      note: 'Erholung gehört zum Training.',
      kind: 'rest',
    };
  }, [plan, suggestion, now, streak.trainedToday, activities]);

  return (
    <Screen topInset>
      {/* 1. Identität: wer du bist, nicht was du tun musst */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="textSecondary">
            {dayHeading(now)}
          </AppText>
          <AppText variant="display" style={styles.greeting} numberOfLines={2}>
            {greeting(now)}
            {name ? `, ${name}` : ''}
          </AppText>
          {identity ? (
            <View style={[styles.teamPill, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
              <AppText variant="eyebrow" color="accent">
                Team {identity.team} · {identity.sessions} {identity.sessions === 1 ? 'Einheit' : 'Einheiten'}
              </AppText>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Suche öffnen"
          onPress={() => router.push('/search')}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
          <Ionicons name="search" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* Belohnung zuerst, wenn es etwas zu feiern gibt (echte Leistung, keine Zufallsbelohnung) */}
      {unseen.length > 0 ? (
        <Card style={[styles.celebrate, { borderColor: theme.accent }]}>
          <View style={[styles.badgeIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="trophy" size={28} color={theme.onAccent} />
          </View>
          <AppText variant="eyebrow" color="accent">
            {unseen.length === 1 ? 'Neues Abzeichen' : `${unseen.length} neue Abzeichen`}
          </AppText>
          {unseen.map((key) => (
            <AppText key={key} variant="hero" style={styles.centerText}>
              {BADGES.find((b) => b.key === key)?.name ?? key}
            </AppText>
          ))}
          <Button title="Super!" onPress={markSeen} style={styles.fullWidth} />
        </Card>
      ) : null}

      {/* 2. Genau eine nächste Handlung, ein Tipp bis zum Training */}
      <ImageCard
        source={sceneForKind(hero.kind)}
        height={hero.href ? 340 : 260}
        accessibilityLabel={`${hero.label}: ${hero.title}`}
        onPress={hero.href ? () => router.push(hero.href as Href) : plan ? () => router.push('/plan') : undefined}>
        <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
          {hero.label}
        </AppText>
        <AppText variant="display" style={[styles.onImage, styles.heroTitle]} numberOfLines={2} adjustsFontSizeToFit>
          {hero.title}
        </AppText>
        <AppText style={styles.onImageSoft} numberOfLines={2}>
          {hero.text}
        </AppText>
        {hero.href ? (
          <>
            <View style={[styles.cta, { backgroundColor: OnImage.accent }]}>
              <Ionicons name="play" size={20} color="#0B0D10" />
              <AppText variant="heading" style={styles.onAccentFixed}>
                {hero.cta}
              </AppText>
            </View>
            <AppText variant="caption" style={[styles.onImageSoft, styles.centerText]}>
              {hero.note}
            </AppText>
          </>
        ) : (
          <View style={styles.heroFooter}>
            <Ionicons name="checkmark-circle" size={22} color={OnImage.accent} />
            <AppText variant="caption" style={styles.onImageSoft}>
              {hero.note}
            </AppText>
          </View>
        )}
      </ImageCard>

      {/* Ohne Plan: Einladung (Wenn-Dann-Pläne erhöhen die Umsetzung) */}
      {plan ? null : (
        <Card onPress={() => router.push('/plan/setup')} style={styles.inviteRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="calendar" size={24} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">Dein persönlicher Plan</AppText>
            <AppText variant="caption" color="textSecondary">
              In einer Minute: Ziel, Tage und Zeit wählen.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Card>
      )}

      {/* 3. Sichtbarer Fortschritt: große Zahlen, Ziel-Ring, Serie, fairer Vergleich mit dir selbst */}
      <SectionHeader title="Diese Woche" action={{ label: 'Fortschritt', onPress: () => router.push('/history') }} />
      <Card style={styles.weekCard}>
        <View style={styles.goalRow}>
          <ProgressRing progress={goal.ratio} size={96} strokeWidth={11}>
            <AppText variant="number" style={styles.ringNumber}>
              {goal.activeDays}/{goal.goal}
            </AppText>
          </ProgressRing>
          <View style={styles.flex}>
            <AppText variant="eyebrow" color="accent">
              {goal.reached ? 'Wochenziel erreicht' : plan ? 'Wochenziel laut Plan' : 'Wochenziel'}
            </AppText>
            <AppText variant="heading">{goal.message}</AppText>
          </View>
        </View>

        <View style={[styles.stats, { borderColor: theme.border }]}>
          <Stat label="Einheiten" value={String(week.workouts)} style={styles.flex} />
          <Stat label="Zeit" value={time.value} unit={time.unit} style={styles.flex} />
          <Stat label="Distanz" value={distance.value} unit={distance.unit} style={styles.flex} />
        </View>

        <View style={styles.days} accessibilityLabel={`${goal.activeDays} Trainingstage diese Woche`}>
          {DAYS.map((day, i) => {
            const done = week.perDay[i] > 0;
            const isToday = i === today;
            return (
              <View key={i} style={styles.day}>
                <View
                  style={[
                    styles.dayBar,
                    {
                      backgroundColor: done ? theme.accent : theme.surfaceAlt,
                      borderColor: isToday ? theme.text : 'transparent',
                      opacity: i > today && !done ? 0.5 : 1,
                    },
                  ]}>
                  {done ? <Ionicons name="checkmark" size={16} color={theme.onAccent} /> : null}
                </View>
                <AppText variant="eyebrow" color={isToday ? 'text' : 'textSecondary'}>
                  {day}
                </AppText>
              </View>
            );
          })}
        </View>

        {comparison.message ? (
          <View style={styles.inline}>
            <Ionicons name="trending-up" size={18} color={theme.accent} />
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              {comparison.message}
            </AppText>
          </View>
        ) : null}

        {/* Serie mit Freezes: motiviert, ohne bei einem verpassten Tag alles zu nehmen */}
        <View style={[styles.streakRow, { borderTopColor: theme.border }]}>
          <Ionicons name="flame" size={26} color={streak.current > 0 ? theme.accent : theme.textSecondary} />
          <View style={styles.flex}>
            <AppText variant="heading">
              {streak.current > 0 ? `${streak.current} ${streak.current === 1 ? 'Tag' : 'Tage'} in Folge` : 'Starte deine Serie'}
            </AppText>
            <AppText variant="caption" color={streak.atRisk ? 'accent' : 'textSecondary'}>
              {streak.atRisk
                ? 'Schon 10 Minuten heute verlängern deine Serie.'
                : streak.trainedToday
                  ? 'Heute erledigt.'
                  : streak.longest > 0
                    ? `Rekord: ${streak.longest} ${streak.longest === 1 ? 'Tag' : 'Tage'}`
                    : 'Jeder Trainingstag zählt.'}
            </AppText>
          </View>
          <View style={styles.freezes} accessibilityLabel={`${streak.freezesLeft} von ${FREEZES_PER_MONTH} Freezes übrig`}>
            {Array.from({ length: FREEZES_PER_MONTH }, (_, i) => (
              <Ionicons key={i} name="snow" size={18} color={i < streak.freezesLeft ? theme.accent : theme.border} />
            ))}
          </View>
        </View>
      </Card>

      {/* 4. Eigene Aktivitäten (Feed wie bei Strava), bewusst begrenzt */}
      <SectionHeader
        title="Deine Aktivitäten"
        action={feed.length > 0 ? { label: 'Alle ansehen', onPress: () => router.push('/history') } : undefined}
      />
      {feed.length === 0 ? (
        <Card>
          <AppText variant="heading">Deine erste Einheit wartet</AppText>
          <AppText color="textSecondary">
            Tippe unten auf das Plus. Danach steht sie hier mit allen Kennzahlen und Rekorden.
          </AppText>
        </Card>
      ) : (
        feed.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            name={name}
            now={now}
            units={units}
            onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}
          />
        ))
      )}

      {/* 5. Nahe Ziele: nächstes Abzeichen (Goal-Gradient), Challenge, Event */}
      {upcoming && upcomingBadge ? (
        <>
          <SectionHeader title="Als Nächstes" />
          <Card onPress={() => router.push('/history/badges')}>
            <View style={styles.inviteRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name={upcomingBadge.icon as IconName} size={26} color={theme.text} />
              </View>
              <View style={styles.flex}>
                <AppText variant="eyebrow" color="textSecondary">
                  Nächstes Abzeichen
                </AppText>
                <AppText variant="heading">{upcomingBadge.name}</AppText>
              </View>
              <AppText variant="number" style={styles.percent}>
                {Math.round(upcoming.ratio * 100)}%
              </AppText>
            </View>
            <View style={[styles.barTrack, { backgroundColor: theme.accentSoft }]}>
              <View style={[styles.barFill, { backgroundColor: theme.accent, width: `${Math.max(4, Math.round(upcoming.ratio * 100))}%` }]} />
            </View>
            <AppText variant="caption" color="textSecondary">
              {upcomingBadge.description} · {formatProgress(upcoming.current)} von {upcoming.target}
            </AppText>
          </Card>
        </>
      ) : null}

      {featuredChallenge ? (
        <ChallengeCard
          featured
          challenge={featuredChallenge.challenge}
          joined={featuredChallenge.joined}
          progress={featuredChallenge.progress}
          now={now}
          onPress={() => router.push({ pathname: '/discover/challenge/[id]', params: { id: featuredChallenge.challenge.id } })}
        />
      ) : null}

      {nextEvent ? (
        <>
          <SectionHeader title="Demnächst" action={{ label: 'Alle Events', onPress: () => router.push('/discover') }} />
          <EventCard event={nextEvent} now={now} compact />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, paddingTop: Spacing.two },
  headerText: { flex: 1, gap: Spacing.one },
  greeting: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  celebrate: { alignItems: 'center', borderWidth: 2 },
  badgeIcon: { width: 60, height: 60, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },

  onImage: { color: '#FFFFFF' },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.85 },
  onAccentFixed: { color: '#0B0D10' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 54,
    borderRadius: Radius.pill,
    marginTop: Spacing.two,
  },

  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconBox: { width: 52, height: 52, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },

  weekCard: { gap: Spacing.three },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  ringNumber: { fontSize: 26, lineHeight: 30 },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  days: { flexDirection: 'row', gap: Spacing.two },
  day: { flex: 1, alignItems: 'center', gap: Spacing.one },
  dayBar: {
    alignSelf: 'stretch',
    height: 36,
    borderRadius: Radius.small,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  freezes: { flexDirection: 'row', gap: 2 },

  percent: { fontSize: 24, lineHeight: 28 },
  barTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },
});
