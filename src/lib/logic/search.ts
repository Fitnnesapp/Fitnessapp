/**
 * Smarte Suche auf dem Gerät, ohne Internet und ohne KI-Dienst.
 *
 * Sie versteht Alltagssprache über drei einfache Bausteine:
 * - Normalisierung: Groß/klein, Umlaute (ä = ae), Satzzeichen und Füllwörter ("wie kann ich ...")
 * - Synonyme: "joggen" findet Laufen, "Abo" findet Premium, "löschen" findet "Daten löschen"
 * - Tippfehler: kleine Abweichungen (Levenshtein-Abstand) werden toleriert
 */

export type SearchKind = 'funktion' | 'uebung' | 'programm' | 'challenge' | 'event';

export type SearchItem = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  /** Zusätzliche Suchbegriffe, z.B. Muskelgruppe oder typische Fragen */
  keywords: string[];
};

export type SearchResult<T extends SearchItem = SearchItem> = { item: T; score: number };

const STOPWORDS = new Set(
  [
    'wie', 'wo', 'was', 'wann', 'welche', 'welcher', 'welches', 'kann', 'koennen', 'ich', 'man', 'mein', 'meine', 'meinen',
    'meinem', 'mir', 'mich', 'du', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'und', 'oder',
    'zu', 'zum', 'zur', 'mit', 'fuer', 'von', 'im', 'in', 'am', 'an', 'auf', 'ist', 'sind', 'gibt', 'es', 'bitte', 'zeig',
    'zeige', 'finde', 'suche', 'will', 'moechte', 'gern', 'gerne', 'hier', 'da', 'noch', 'mal', 'einmal', 'machen', 'mache',
    'tun', 'gehen', 'app', 'diese', 'dieser', 'dieses', 'alle', 'alles', 'neue', 'neuen', 'neu',
  ],
);

/** Begriffe, die dasselbe meinen. Das erste Wort ist der Oberbegriff. */
const SYNONYM_GROUPS: string[][] = [
  ['laufen', 'joggen', 'lauf', 'laeufe', 'rennen', 'running', 'run', 'jogging', 'gps', 'strecke'],
  ['kraft', 'krafttraining', 'gewichte', 'hanteln', 'gym', 'pumpen', 'muskeln', 'muskelaufbau', 'saetze', 'workout'],
  ['zuhause', 'daheim', 'home', 'wohnzimmer', 'ohne', 'geraete', 'koerpergewicht'],
  ['plan', 'trainingsplan', 'wochenplan', 'routine', 'zeitplan', 'fragebogen'],
  ['loeschen', 'entfernen', 'zuruecksetzen', 'reset', 'weg'],
  ['daten', 'datenschutz', 'privatsphaere', 'dsgvo', 'speicher'],
  ['premium', 'abo', 'abonnement', 'bezahlen', 'kaufen', 'kosten', 'preis', 'testversion', 'probeabo', 'kuendigen'],
  ['erinnerung', 'benachrichtigung', 'push', 'wecker', 'reminder', 'notification'],
  ['abzeichen', 'badge', 'badges', 'auszeichnung', 'medaille', 'trophaee', 'erfolge'],
  ['serie', 'streak', 'flamme', 'freeze', 'folge'],
  ['verlauf', 'historie', 'kalender', 'vergangen', 'protokoll', 'tagebuch'],
  ['rekord', 'rekorde', 'bestleistung', 'bestzeit', 'pr', 'bestwert'],
  ['challenge', 'challenges', 'wettbewerb', 'wettbewerbe', 'herausforderung', 'winterarc', 'arc', 'mitmachen'],
  ['event', 'events', 'wettkampf', 'veranstaltung', 'marathon', 'halbmarathon', 'hyrox', 'termine'],
  ['gesundheit', 'einwilligung', 'beschwerden', 'verletzung', 'knie', 'alter'],
  ['gewicht', 'koerpergewicht', 'kilo', 'kg', 'waage'],
  ['kalorien', 'kcal', 'verbrennen', 'energie'],
  ['einheiten', 'metrisch', 'imperial', 'pfund', 'meilen', 'lb'],
  ['name', 'profil', 'einstellungen', 'konto', 'account'],
  ['jahresrueckblick', 'rueckblick', 'jahr', 'statistik', 'zusammenfassung'],
  ['uebung', 'uebungen', 'bibliothek', 'anleitung', 'technik'],
  ['dehnen', 'mobility', 'beweglichkeit', 'stretching', 'yoga'],
  ['bauch', 'core', 'rumpf', 'sixpack', 'bauchmuskeln'],
  ['hiit', 'intervall', 'intervalle', 'cardio', 'tabata'],
  ['pause', 'ruhezeit', 'timer', 'satzpause'],
  ['vorlage', 'vorlagen', 'template'],
  ['starten', 'start', 'beginnen', 'loslegen', 'anfangen'],
  ['tag', 'tage', 'wochentag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'],
];

const CONCEPT = new Map<string, string>();
for (const group of SYNONYM_GROUPS) for (const word of group) if (!CONCEPT.has(word)) CONCEPT.set(word, group[0]);

/** Kleinschreibung, Umlaute ausschreiben, Satzzeichen entfernen. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 0);
}

/** Suchwörter ohne Füllwörter. Besteht die Anfrage nur aus Füllwörtern, bleiben sie erhalten. */
export function queryTokens(query: string): string[] {
  const all = tokenize(query);
  const meaningful = all.filter((t) => !STOPWORDS.has(t));
  return meaningful.length > 0 ? meaningful : all;
}

/** Levenshtein-Abstand mit Abbruch, sobald `max` überschritten ist. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function allowedTypos(word: string): number {
  if (word.length >= 7) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

/** Oberbegriff eines Wortes, auch bei kleinen Tippfehlern. */
export function conceptOf(word: string): string | undefined {
  const direct = CONCEPT.get(word);
  if (direct) return direct;
  const typos = allowedTypos(word);
  if (typos === 0) return undefined;
  for (const [term, concept] of CONCEPT) {
    if (term.length >= 4 && editDistance(word, term, typos) <= typos) return concept;
  }
  return undefined;
}

type Prepared = { titleTokens: string[]; subTokens: string[]; textTokens: string[]; concepts: Set<string> };

function prepare(item: SearchItem): Prepared {
  const titleTokens = tokenize(item.title);
  const subTokens = tokenize(item.subtitle);
  const textTokens = item.keywords.flatMap(tokenize);
  const concepts = new Set<string>();
  for (const t of [...titleTokens, ...subTokens, ...textTokens]) {
    const c = CONCEPT.get(t);
    if (c) concepts.add(c);
  }
  return { titleTokens, subTokens, textTokens, concepts };
}

/**
 * Punkte für ein einzelnes Suchwort. 0 = kein Treffer.
 * Reihenfolge: Titel vor Untertitel vor Stichworten; genaue Treffer vor Synonymen vor Tippfehlern.
 */
function scoreToken(token: string, p: Prepared): number {
  if (p.titleTokens.includes(token)) return 10;
  if (token.length >= 3 && p.titleTokens.some((t) => t.startsWith(token))) return 8;
  if (p.subTokens.includes(token)) return 7;
  const typos = allowedTypos(token);
  if (typos > 0 && p.titleTokens.some((t) => editDistance(token, t, typos) <= typos)) return 6;
  if (p.textTokens.includes(token)) return 5;
  if (CONCEPT.has(token) && p.concepts.has(CONCEPT.get(token) as string)) return 4;
  if (token.length >= 3 && [...p.subTokens, ...p.textTokens].some((t) => t.startsWith(token))) return 3;
  const fuzzyConcept = conceptOf(token);
  if (fuzzyConcept && p.concepts.has(fuzzyConcept)) return 3;
  if (typos > 0 && [...p.subTokens, ...p.textTokens].some((t) => editDistance(token, t, typos) <= typos)) return 2;
  return 0;
}

/**
 * Durchsucht die Einträge. Jedes Suchwort bringt Punkte; Einträge, die alle Wörter treffen,
 * stehen klar vorn. Funktionen der App bekommen einen kleinen Vorrang.
 */
export function search<T extends SearchItem>(items: readonly T[], query: string, limit = 20): SearchResult<T>[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];

  const results: SearchResult<T>[] = [];
  for (const item of items) {
    const p = prepare(item);
    const scores = tokens.map((t) => scoreToken(t, p));
    const matched = scores.filter((s) => s > 0).length;
    if (matched === 0) continue;
    const coverage = matched / tokens.length;
    // Bei mehreren Wörtern mindestens die Hälfte treffen
    if (tokens.length > 1 && coverage < 0.5) continue;
    const base = scores.reduce((a, b) => a + b, 0) / tokens.length;
    const score = base * (0.5 + coverage / 2) + (coverage === 1 ? 5 : 0) + (item.kind === 'funktion' ? 1 : 0);
    results.push({ item, score: Math.round(score * 10) / 10 });
  }
  return results.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).slice(0, limit);
}
