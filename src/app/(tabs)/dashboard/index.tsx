import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChallengeCard } from '@/components/challenge-card';
import { HeroRings } from '@/components/illustrations/hero-rings';
import { Medal3D } from '@/components/three/medal-3d';
import { EventCard } from '@/components/event-card';
import { PremiumPrompt } from '@/components/premium-prompt';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useActivities } from '@/hooks/use-activities';
import { useBadgeContext } from '@/hooks/use-badge-context';
import { useChallenges } from '@/hooks/use-challenges';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { FREEZES_PER_MONTH, streaks, weekStart, weekStats } from '@/lib/logic/activity';
import { muscleVolume } from '@/lib/logic/analytics';
import { daysUntilEvent, upcomingEvents } from '@/lib/logic/events';
import { BADGES } from '@/lib/logic/badges';
import { formatDuration } from '@/lib/logic/format';
import { dayHeading, greeting, nextBadge, WEEKLY_GOAL_DAYS, weeklyGoal } from '@/lib/logic/motivation';
import { missedLastPlanned, nextSession, plannedDaysThisWeek, sessionsForDay, WEEKDAY_NAMES } from '@/lib/logic/plan';
import { suggestWorkout, type SuggestionTarget } from '@/lib/logic/suggestions';
import { formatDistance, formatWeight } from '@/lib/logic/units';
import { hrefForSession } from '@/lib/plan-href';
import { useEvents, useEventsStore } from '@/lib/storage/events-store';
import { useGamification } from '@/lib/storage/gamification-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Hero = { label: string; title: string; text: string; href: Href | null; note: string };

function hrefFor(target: SuggestionTarget): Href {
  if (target.kind === 'strength') return '/training/strength';
  if (target.kind === 'run') return '/training/running';
  return { pathname: '/training/program/[id]', params: { id: target.programId } };
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const QUICK_START: { label: string; hint: string; icon: IconName; href: Href }[] = [
  { label: 'Kraft', hint: 'Sätze loggen', icon: 'barbell', href: '/training/strength' },
  { label: 'Home', hint: 'Ohne Geräte', icon: 'body', href: '/training/home' },
  { label: 'Laufen', hint: 'Mit GPS', icon: 'walk', href: '/training/running' },
];

/**
 * Start-Bildschirm. Aufbau nach dem Muster großer Fitness-Apps:
 * zuerst der nächste Schritt (Vorschlag), dann der Fortschritt (Wochenziel-Ring, Serie),
 * dann das nächste erreichbare Ziel (Abzeichen) und schnelle Wege ins Training.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const name = useSettings((state) => state.displayName).trim();
  const activities = useActivities();
  const now = useNow(60_000);
  const { isPremium } = useSubscription();
  const strengthHistory = useWorkouts((state) => state.history);
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
  const nextEvent = useMemo(
    () => upcomingEvents(events, now, 1).find((e) => daysUntilEvent(e, now) <= 14),
    [events, now],
  );
  // Eine Challenge auf dem Start-Bildschirm: die eigene, sonst eine laufende als Einladung
  const featuredChallenge =
    challengeEntries.find((e) => e.joined && !e.progress?.completed) ??
    challengeEntries.find((e) => !e.joined && e.challenge.window.kind === 'fixed');

  const week = useMemo(() => weekStats(activities, weekStart(now)), [activities, now]);
  const goal = useMemo(
    () => weeklyGoal(week.perDay, plan ? Math.max(1, plannedDaysThisWeek(plan, weekStart(now))) : WEEKLY_GOAL_DAYS),
    [week, plan, now],
  );
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const upcoming = useMemo(() => nextBadge(badgeContext, earned), [badgeContext, earned]);
  const upcomingBadge = upcoming ? BADGES.find((b) => b.key === upcoming.key) : undefined;
  const muscles = useMemo(
    () => muscleVolume(strengthHistory, 30, now, (id) => getExercise(id)?.muscleGroup),
    [strengthHistory, now],
  );
  const maxVolume = Math.max(1, ...muscles.map((m) => m.volumeKg));
  const suggestion = useMemo(
    () => suggestWorkout({ activities, strength: strengthHistory, now, muscleGroupOf: (id) => getExercise(id)?.muscleGroup }),
    [activities, strengthHistory, now],
  );
  const today = (new Date(now).getDay() + 6) % 7;
  const earnedCount = Object.keys(earned).length;

  // Was die große Karte oben zeigt: mit Plan die heutige Einheit, sonst den regelbasierten Vorschlag
  const hero = useMemo((): Hero => {
    if (!plan) {
      return {
        label: 'HEUTE FÜR DICH',
        title: suggestion.title,
        text: suggestion.reason,
        href: suggestion.target ? hrefFor(suggestion.target) : null,
        note: 'Aus einfachen Regeln, keine KI',
      };
    }
    const [session, extra] = sessionsForDay(plan, now);
    if (session && !streak.trainedToday) {
      const comeback = missedLastPlanned(plan, activities, now);
      return {
        label: comeback ? 'COMEBACK-TAG' : `HEUTE IN DEINEM PLAN · ${session.minutes} MIN`,
        title: session.title,
        text: comeback
          ? 'Die letzte Einheit ist ausgefallen. Kein Problem: Entscheidend ist, dass du heute wieder einsteigst.'
          : session.detail,
        href: hrefForSession(session),
        note: extra
          ? `Danach: ${extra.minutes} Min ${extra.title}`
          : comeback
            ? `${session.minutes} Minuten, die zählen`
            : 'Dein Plan, deine Zeit',
      };
    }
    const upcomingSession = nextSession(plan, now);
    const when = upcomingSession
      ? upcomingSession.inDays === 1
        ? 'Morgen'
        : WEEKDAY_NAMES[upcomingSession.session.day]
      : null;
    return {
      label: session ? 'HEUTE ERLEDIGT' : now < plan.startsAt ? 'DEIN PLAN STARTET BALD' : 'RUHETAG LAUT PLAN',
      title: session ? 'Stark, Einheit geschafft' : now < plan.startsAt ? `Start am ${dayHeading(plan.startsAt)}` : 'Heute ist Erholung dran',
      text: upcomingSession ? `${when}: ${upcomingSession.session.title}` : 'Erholung gehört zum Training.',
      href: null,
      note: 'Erholung gehört zum Training.',
    };
  }, [plan, suggestion, now, streak.trainedToday, activities]);

  return (
    <Screen topInset>
      {/* Kopfzeile: Datum, Begrüßung, Serie immer im Blick */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="label" color="textSecondary">
            {dayHeading(now).toUpperCase()}
          </AppText>
          <AppText variant="title" numberOfLines={2}>
            {greeting(now)}
            {name ? `, ${name}` : ''}
          </AppText>
        </View>
        {streak.current > 0 ? (
          <View
            style={[styles.streakPill, { backgroundColor: theme.accentSoft }]}
            accessibilityLabel={`Serie: ${streak.current} Tage in Folge`}>
            <Ionicons name="flame" size={20} color={theme.accent} />
            <AppText variant="heading" style={styles.tabular}>
              {streak.current}
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Suche: jede Funktion in einem Schritt erreichbar */}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Suche öffnen"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
        <Ionicons name="sparkles" size={18} color={theme.accent} />
        <AppText color="textSecondary" style={styles.flex} numberOfLines={1}>
          Suchen oder fragen …
        </AppText>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
      </Pressable>

      {/* Belohnung zuerst, wenn es etwas zu feiern gibt */}
      {unseen.length > 0 ? (
        <Card style={[styles.celebrate, { borderColor: theme.accent }]}>
          <Medal3D
            size={160}
            fallback={
              <View style={[styles.badgeIcon, { backgroundColor: theme.accent }]}>
                <Ionicons name="trophy" size={26} color={theme.onAccent} />
              </View>
            }
          />
          <AppText variant="label" color="accent">
            {unseen.length === 1 ? 'NEUES ABZEICHEN' : `${unseen.length} NEUE ABZEICHEN`}
          </AppText>
          {unseen.map((key) => (
            <AppText key={key} variant="title" style={styles.centerText}>
              {BADGES.find((b) => b.key === key)?.name ?? key}
            </AppText>
          ))}
          <Button title="Super!" onPress={markSeen} style={styles.fullWidth} />
        </Card>
      ) : null}

      {/* Der nächste Schritt: eine klare Handlung statt vieler Optionen */}
      <Pressable
        accessibilityRole="button"
        disabled={!hero.href && !plan}
        onPress={hero.href ? () => router.push(hero.href as Href) : () => router.push('/plan')}
        style={({ pressed }) => [
          styles.hero,
          { backgroundColor: hero.href ? theme.accent : theme.surface, borderColor: hero.href ? theme.accent : theme.border },
          pressed && styles.pressed,
        ]}>
        {hero.href ? <HeroRings color={theme.onAccent} /> : null}
        <AppText variant="label" style={{ color: hero.href ? theme.onAccent : theme.accent, opacity: 0.8 }}>
          {hero.label}
        </AppText>
        <AppText variant="title" style={{ color: hero.href ? theme.onAccent : theme.text }}>
          {hero.title}
        </AppText>
        <AppText style={{ color: hero.href ? theme.onAccent : theme.textSecondary, opacity: hero.href ? 0.85 : 1 }}>
          {hero.text}
        </AppText>
        {hero.href ? (
          <View style={styles.heroFooter}>
            <View style={[styles.playButton, { backgroundColor: theme.onAccent }]}>
              <Ionicons name="play" size={18} color={theme.accent} />
              <AppText variant="heading" style={{ color: theme.accent }}>
                Los geht&apos;s
              </AppText>
            </View>
            <AppText variant="caption" style={[styles.flex, { color: theme.onAccent, opacity: 0.7 }]}>
              {hero.note}
            </AppText>
          </View>
        ) : (
          <View style={styles.heroFooter}>
            <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
            <AppText variant="caption" color="textSecondary">
              {hero.note}
            </AppText>
          </View>
        )}
      </Pressable>

      {/* Ohne Plan: Einladung, einen zu erstellen (Wenn-Dann-Pläne erhöhen die Umsetzung) */}
      {plan ? null : (
        <Card onPress={() => router.push('/plan/setup')} style={styles.planInvite}>
          <View style={[styles.flameBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="calendar" size={24} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">Dein persönlicher Plan</AppText>
            <AppText variant="caption" color="textSecondary">
              In einer Minute: Ziel, Tage und Zeit wählen, fertig ist dein Wochenplan.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Card>
      )}

      {/* Wochenziel als Ring: sichtbarer Fortschritt motiviert, ein kleines Ziel ist erreichbar */}
      <Card>
        <View style={styles.goalRow}>
          <ProgressRing progress={goal.ratio} size={112} strokeWidth={12}>
            <AppText variant="title" style={styles.tabular}>
              {goal.activeDays}/{goal.goal}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Tage
            </AppText>
          </ProgressRing>
          <View style={styles.goalText}>
            <AppText variant="label" color="accent">
              {goal.reached ? 'WOCHENZIEL ERREICHT' : plan ? 'WOCHENZIEL LAUT PLAN' : 'WOCHENZIEL'}
            </AppText>
            <AppText variant="heading">{goal.message}</AppText>
            <View style={styles.miniStats}>
              <MiniStat icon="time-outline" value={formatDuration(week.durationSeconds * 1000)} />
              <MiniStat icon="navigate-outline" value={formatDistance(week.distanceM, units)} />
            </View>
          </View>
        </View>

        <View style={styles.days}>
          {DAYS.map((day, i) => {
            const done = week.perDay[i] > 0;
            const isToday = i === today;
            return (
              <View key={day} style={styles.day}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: done ? theme.accent : i > today ? 'transparent' : theme.surfaceAlt,
                      borderColor: isToday ? theme.text : done ? theme.accent : theme.border,
                    },
                  ]}>
                  {done ? <Ionicons name="checkmark" size={18} color={theme.onAccent} /> : null}
                </View>
                <AppText variant="caption" color={isToday ? 'text' : 'textSecondary'} style={isToday && styles.bold}>
                  {day}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Serie mit Freezes: motiviert, ohne bei einem verpassten Tag alles zu nehmen */}
      <Card>
        <View style={styles.streakRow}>
          <View style={[styles.flameBox, { backgroundColor: streak.current > 0 ? theme.accentSoft : theme.surfaceAlt }]}>
            <Ionicons name="flame" size={30} color={streak.current > 0 ? theme.accent : theme.textSecondary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">
              {streak.current > 0
                ? `${streak.current} ${streak.current === 1 ? 'Tag' : 'Tage'} in Folge`
                : 'Starte deine Serie'}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {streak.longest > 0
                ? `Rekord: ${streak.longest} ${streak.longest === 1 ? 'Tag' : 'Tage'}`
                : 'Jeder Trainingstag zählt'}
            </AppText>
          </View>
          <View style={styles.freezes} accessibilityLabel={`${streak.freezesLeft} von ${FREEZES_PER_MONTH} Freezes übrig`}>
            {Array.from({ length: FREEZES_PER_MONTH }, (_, i) => (
              <Ionicons key={i} name="snow" size={18} color={i < streak.freezesLeft ? theme.accent : theme.border} />
            ))}
          </View>
        </View>
        <AppText variant="caption" color={streak.atRisk ? 'accent' : 'textSecondary'}>
          {streak.atRisk
            ? 'Heute ist noch alles offen. Schon 10 Minuten verlängern deine Serie.'
            : streak.trainedToday
              ? 'Heute erledigt. Deine Serie läuft weiter.'
              : `Ein Freeze überbrückt einen Tag ohne Training. ${streak.freezesLeft} von ${FREEZES_PER_MONTH} übrig diesen Monat.`}
        </AppText>
      </Card>

      {featuredChallenge ? (
        <ChallengeCard
          featured
          challenge={featuredChallenge.challenge}
          joined={featuredChallenge.joined}
          progress={featuredChallenge.progress}
          now={now}
          onPress={() =>
            router.push({ pathname: '/discover/challenge/[id]', params: { id: featuredChallenge.challenge.id } })
          }
        />
      ) : null}

      {nextEvent ? (
        <>
          <View style={styles.sectionRow}>
            <AppText variant="heading" style={styles.flex}>
              Demnächst
            </AppText>
            <AppText variant="label" color="accent" onPress={() => router.push('/discover')}>
              Alle Events
            </AppText>
          </View>
          <EventCard event={nextEvent} now={now} compact />
        </>
      ) : null}

      {/* Nächstes Abzeichen: ein konkretes, nahes Ziel (Zielgradient-Effekt) */}
      {upcoming && upcomingBadge ? (
        <Card onPress={() => router.push('/dashboard/badges')}>
          <View style={styles.streakRow}>
            <View style={[styles.flameBox, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name={upcomingBadge.icon as IconName} size={26} color={theme.text} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color="textSecondary">
                NÄCHSTES ABZEICHEN
              </AppText>
              <AppText variant="heading">{upcomingBadge.name}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
          <View style={[styles.barTrack, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.barFill, { backgroundColor: theme.accent, width: `${Math.max(4, Math.round(upcoming.ratio * 100))}%` }]} />
          </View>
          <AppText variant="caption" color="textSecondary">
            {upcomingBadge.description} · {formatProgress(upcoming.current)} von {upcoming.target}
          </AppText>
        </Card>
      ) : null}

      {/* Schnellstart: jede Trainingsart mit einem Tipp erreichbar */}
      <AppText variant="heading">Direkt loslegen</AppText>
      <View style={styles.quickRow}>
        {QUICK_START.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.quickTile,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.quickIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name={item.icon} size={22} color={theme.accent} />
            </View>
            <AppText variant="heading">{item.label}</AppText>
            <AppText variant="caption" color="textSecondary">
              {item.hint}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="heading">Muskelgruppen (30 Tage)</AppText>
      {isPremium ? (
        <Card>
          {muscles.length === 0 ? (
            <AppText color="textSecondary">Noch kein Krafttraining in den letzten 30 Tagen.</AppText>
          ) : (
            muscles.map((m) => (
              <View key={m.group} style={styles.muscleRow}>
                <AppText style={styles.muscleName}>{m.group}</AppText>
                <View style={[styles.barTrack, styles.flex, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[styles.barFill, { backgroundColor: theme.accent, width: `${Math.round((m.volumeKg / maxVolume) * 100)}%` }]}
                  />
                </View>
                <AppText variant="caption" color="textSecondary" style={styles.muscleValue}>
                  {formatWeight(m.volumeKg, units)}
                </AppText>
              </View>
            ))
          )}
        </Card>
      ) : (
        <PremiumPrompt
          title="Muskelgruppen-Analyse"
          text="Sieh, welche Muskelgruppen du in den letzten 30 Tagen wie stark trainiert hast."
        />
      )}

      <View style={styles.quickRow}>
        <LinkTile icon="calendar-number-outline" title="Jahresrückblick" text="Dein Jahr in Zahlen" onPress={() => router.push('/dashboard/year')} />
        <LinkTile
          icon="ribbon-outline"
          title="Abzeichen"
          text={`${earnedCount} von ${BADGES.length} erreicht`}
          onPress={() => router.push('/dashboard/badges')}
        />
      </View>
    </Screen>
  );
}

/** Ganze Zahlen ohne Nachkommastellen, Kilometer mit einer. */
function formatProgress(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function MiniStat({ icon, value }: { icon: IconName; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={15} color={theme.textSecondary} />
      <AppText variant="caption" color="textSecondary" style={styles.tabular}>
        {value}
      </AppText>
    </View>
  );
}

function LinkTile({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={styles.linkTile}>
      <Ionicons name={icon} size={22} color={theme.accent} />
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" color="textSecondary">
        {text}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  tabular: { fontVariant: ['tabular-nums'] },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  headerText: { flex: 1, gap: 2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },

  celebrate: { alignItems: 'center', borderWidth: 2 },
  badgeIcon: { width: 56, height: 56, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },

  hero: { padding: Spacing.four, borderRadius: Radius.large, borderWidth: 1, gap: Spacing.two, overflow: 'hidden' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.pill,
  },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  goalText: { flex: 1, gap: Spacing.one },
  miniStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.one },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.three },
  day: { alignItems: 'center', gap: Spacing.one },
  dot: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flameBox: { width: 52, height: 52, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  freezes: { flexDirection: 'row', gap: 2 },

  barTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },

  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickTile: { flex: 1, padding: Spacing.three, borderRadius: Radius.large, borderWidth: 1, gap: Spacing.one },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  linkTile: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  planInvite: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  sectionRow: { flexDirection: 'row', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  muscleName: { width: 84 },
  muscleValue: { width: 64, textAlign: 'right' },
});
