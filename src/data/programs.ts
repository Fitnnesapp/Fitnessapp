import type { Program, ProgramCategory, ProgramStep } from '@/types/home';

const step = (name: string, instruction: string, seconds?: number): ProgramStep => ({ name, instruction, seconds });

// Eigene Formulierungen, kein lizenziertes Material.
export const PROGRAMS: readonly Program[] = [
  {
    id: 'hiit-express',
    name: 'HIIT Express',
    description: 'Kurzes Intervalltraining für den ganzen Körper. Ideal für zwischendurch.',
    category: 'HIIT',
    difficulty: 'Einsteiger',
    workSeconds: 30,
    restSeconds: 15,
    rounds: 2,
    steps: [
      step('Hampelmänner', 'Springe mit gespreizten Beinen und Armen über dem Kopf, dann wieder zusammen.'),
      step('Kniebeugen', 'Füße schulterbreit, Gesäß nach hinten unten schieben, Brust aufrecht, kraftvoll hochkommen.'),
      step('Bergsteiger', 'In der Liegestützposition die Knie abwechselnd schnell zur Brust ziehen.'),
      step('Liegestütze', 'Körper in einer Linie halten und die Brust zum Boden senken. Zur Erleichterung auf den Knien.'),
      step('Ausfallschritte', 'Abwechselnd einen großen Schritt nach vorn, hinteres Knie Richtung Boden.'),
      step('Kniehebelauf', 'Auf der Stelle laufen und die Knie bis auf Hüfthöhe heben.'),
      step('Unterarmstütz', 'Auf den Unterarmen stützen, Körper gerade halten, Bauch und Gesäß anspannen.'),
      step('Skater', 'Seitlich von einem Bein auf das andere springen, wie beim Eisschnelllauf.'),
    ],
  },
  {
    id: 'hiit-inferno',
    name: 'HIIT Inferno',
    description: 'Intensive Intervalle mit kurzen Pausen. Für alle, die schon fit sind.',
    category: 'HIIT',
    difficulty: 'Fortgeschritten',
    workSeconds: 40,
    restSeconds: 20,
    rounds: 3,
    steps: [
      step('Burpees', 'Hocke, Beine nach hinten in den Liegestütz, zurückspringen und nach oben springen.'),
      step('Sprung-Kniebeugen', 'Tiefe Kniebeuge, dann explosiv nach oben springen und weich landen.'),
      step('Bergsteiger', 'In der Liegestützposition die Knie schnell abwechselnd zur Brust ziehen.'),
      step('Diamant-Liegestütze', 'Hände eng unter der Brust, Ellbogen nah am Körper beugen.'),
      step('Sprung-Ausfallschritte', 'Aus dem Ausfallschritt springen und in der Luft die Beine wechseln.'),
      step('Hampelmänner', 'Springe mit gespreizten Beinen und Armen über dem Kopf, dann wieder zusammen.'),
      step('Plank-Jacks', 'Im Unterarmstütz die Füße abwechselnd auseinander und zusammen springen.'),
      step('Hocksprünge', 'Aus der Hocke so hoch wie möglich springen und die Arme mitschwingen.'),
    ],
  },
  {
    id: 'core-basics',
    name: 'Core Basics',
    description: 'Solides Bauch- und Rumpftraining ohne Geräte.',
    category: 'Core',
    difficulty: 'Einsteiger',
    workSeconds: 40,
    restSeconds: 20,
    rounds: 2,
    steps: [
      step('Crunches', 'Auf dem Rücken liegend den Oberkörper einrollen, Nacken entspannt lassen.'),
      step('Unterarmstütz', 'Körper in einer Linie halten, Bauch fest anspannen.'),
      step('Beinheben', 'Liegend die gestreckten Beine anheben und kontrolliert absenken, Rücken am Boden.'),
      step('Russian Twists', 'Im Sitzen mit leicht zurückgelehntem Oberkörper die Hände abwechselnd zu beiden Seiten führen.'),
      step('Fahrrad-Crunches', 'Ellbogen und gegenüberliegendes Knie abwechselnd zusammenführen.'),
      step('Seitstütz links', 'Auf dem Unterarm seitlich stützen, Hüfte oben halten.'),
      step('Seitstütz rechts', 'Auf dem anderen Unterarm seitlich stützen, Hüfte oben halten.'),
    ],
  },
  {
    id: 'core-burn',
    name: 'Core Burn',
    description: 'Fordernde Bauchübungen mit langen Intervallen.',
    category: 'Core',
    difficulty: 'Fortgeschritten',
    workSeconds: 45,
    restSeconds: 15,
    rounds: 2,
    steps: [
      step('V-Ups', 'Auf dem Rücken liegend Oberkörper und gestreckte Beine gleichzeitig zu einem V anheben.'),
      step('Unterarmstütz mit Armwechsel', 'Abwechselnd vom Unterarm auf die Hand und zurück stützen.'),
      step('Beinscheren', 'Liegend die gestreckten Beine knapp über dem Boden abwechselnd kreuzen.'),
      step('Bergsteiger', 'Im Liegestütz die Knie schnell abwechselnd zur Brust ziehen.'),
      step('Hollow Hold', 'Auf dem Rücken Schultern und Beine leicht anheben, Rücken bleibt am Boden.'),
      step('Seitlicher Unterarmstütz mit Hüftsenken', 'Im Seitstütz die Hüfte absenken und wieder anheben, dann Seite wechseln.'),
      step('Käfer', 'Auf dem Rücken Arme und Beine nach oben, gegenüberliegende Glieder abwechselnd strecken.'),
    ],
  },
  {
    id: 'mobility-morgen',
    name: 'Mobility Morgen',
    description: 'Sanftes Aufwachen für Rücken, Hüfte und Schultern.',
    category: 'Mobility',
    difficulty: 'Einsteiger',
    workSeconds: 40,
    restSeconds: 5,
    rounds: 1,
    steps: [
      step('Katze und Kuh', 'Im Vierfüßlerstand den Rücken abwechselnd rund und hohl machen, im Atemrhythmus.'),
      step('Kind-Pose', 'Gesäß auf die Fersen setzen, Arme nach vorn strecken, ruhig atmen.'),
      step('Hüftkreisen', 'Im Stand die Hüfte in großen Kreisen bewegen, Richtung nach der Hälfte wechseln.'),
      step('Ausfallschritt-Dehnung links', 'Tiefer Ausfallschritt, Hüfte nach vorn schieben und halten.'),
      step('Ausfallschritt-Dehnung rechts', 'Seite wechseln, Hüfte nach vorn schieben und halten.'),
      step('Schulterkreisen', 'Arme seitlich ausstrecken und in kleinen, dann großen Kreisen bewegen.'),
      step('Wirbelsäulen-Drehung', 'Im Sitzen den Oberkörper zu einer Seite drehen, nach der Hälfte wechseln.'),
      step('Vorbeuge', 'Im Stand mit lockeren Knien den Oberkörper hängen lassen.'),
    ],
  },
  {
    id: 'mobility-abend',
    name: 'Mobility Abend',
    description: 'Entspannende Dehnungen zum Runterkommen nach dem Tag.',
    category: 'Mobility',
    difficulty: 'Einsteiger',
    workSeconds: 50,
    restSeconds: 10,
    rounds: 1,
    steps: [
      step('Taubenpose links', 'Vorderes Bein angewinkelt vor dem Körper ablegen, Oberkörper nach vorn sinken lassen.'),
      step('Taubenpose rechts', 'Seite wechseln und entspannt halten.'),
      step('Schmetterlingssitz', 'Fußsohlen aneinander, Knie nach außen sinken lassen, Rücken gerade.'),
      step('Liegende Drehung links', 'Auf dem Rücken ein Knie über den Körper zur Seite ablegen, Schultern am Boden.'),
      step('Liegende Drehung rechts', 'Seite wechseln und ruhig atmen.'),
      step('Oberschenkel-Dehnung', 'Im Stand die Ferse zum Gesäß ziehen, abwechselnd nach der Hälfte der Zeit.'),
      step('Nackendehnung', 'Ohr sanft zur Schulter neigen, nach der Hälfte der Zeit die Seite wechseln.'),
    ],
  },
  {
    id: 'ganzkoerper-basics',
    name: 'Ganzkörper Basics',
    description: 'Klassische Übungen für Beine, Rumpf und Oberkörper in ruhigem Tempo.',
    category: 'Ganzkörper',
    difficulty: 'Einsteiger',
    workSeconds: 40,
    restSeconds: 20,
    rounds: 2,
    steps: [
      step('Kniebeugen', 'Füße schulterbreit, Gesäß nach hinten unten, Knie über den Füßen.'),
      step('Liegestütze auf den Knien', 'Körper von den Knien bis zum Kopf gerade halten, Brust zum Boden senken.'),
      step('Glute Bridge', 'Auf dem Rücken die Hüfte anheben, oben das Gesäß anspannen.'),
      step('Ausfallschritte', 'Abwechselnd nach vorn ausfallen und kontrolliert zurückdrücken.'),
      step('Superman', 'Auf dem Bauch Arme und Beine gleichzeitig anheben und kurz halten.'),
      step('Unterarmstütz', 'Körper in einer Linie halten und ruhig atmen.'),
    ],
  },
  {
    id: 'ganzkoerper-power',
    name: 'Ganzkörper Power',
    description: 'Kraft und Ausdauer in einem fordernden Zirkel.',
    category: 'Ganzkörper',
    difficulty: 'Fortgeschritten',
    workSeconds: 45,
    restSeconds: 15,
    rounds: 3,
    steps: [
      step('Kniebeugen mit Sprung', 'Tief beugen und kraftvoll nach oben springen.'),
      step('Liegestütze', 'Körper in einer Linie, Brust fast bis zum Boden senken.'),
      step('Bulgarian Split Squats links', 'Hinteren Fuß auf einem Stuhl ablegen, vorderes Bein tief beugen.'),
      step('Bulgarian Split Squats rechts', 'Seite wechseln und tief beugen.'),
      step('Bergsteiger', 'Knie schnell abwechselnd zur Brust ziehen.'),
      step('Dips am Stuhl', 'Hände an der Stuhlkante, Gesäß absenken und wieder hochdrücken.'),
    ],
  },
];

export const CATEGORIES: readonly ProgramCategory[] = ['HIIT', 'Core', 'Mobility', 'Ganzkörper'];

const BY_ID = new Map(PROGRAMS.map((program) => [program.id, program]));

export function getProgram(id: string | undefined): Program | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Im kostenlosen Zugang enthaltene Programme. Alle weiteren brauchen Premium. */
export const FREE_PROGRAM_IDS: readonly string[] = ['hiit-express', 'core-basics', 'mobility-morgen'];

export const isFreeProgram = (id: string): boolean => FREE_PROGRAM_IDS.includes(id);
