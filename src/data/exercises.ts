import type { Difficulty, Equipment, Exercise, MuscleGroup } from '@/types/workout';

type Row = [id: string, name: string, muscle: MuscleGroup, equipment: Equipment, difficulty: Difficulty, instructions: string];

// Reine Textanleitungen: eigene Formulierungen, kein lizenziertes Bild- oder Videomaterial.
const ROWS: Row[] = [
  // Brust
  ['bankdruecken', 'Bankdrücken', 'Brust', 'Langhantel', 'Fortgeschritten', 'Auf der Flachbank liegen, Schulterblätter zusammenziehen, Stange kontrolliert zur Brust senken und kraftvoll nach oben drücken.'],
  ['schraegbankdruecken', 'Schrägbankdrücken', 'Brust', 'Langhantel', 'Fortgeschritten', 'Bank auf 30 bis 45 Grad stellen und die Stange zur oberen Brust senken, dann nach oben drücken.'],
  ['kh-bankdruecken', 'Kurzhantel-Bankdrücken', 'Brust', 'Kurzhantel', 'Einsteiger', 'Kurzhanteln über der Brust halten, seitlich tief absenken und wieder zusammenführen.'],
  ['kh-schraegbankdruecken', 'Kurzhantel-Schrägbankdrücken', 'Brust', 'Kurzhantel', 'Einsteiger', 'Auf der Schrägbank die Hanteln von der oberen Brust nach oben drücken, Ellbogen leicht angewinkelt.'],
  ['fliegende', 'Fliegende mit Kurzhanteln', 'Brust', 'Kurzhantel', 'Einsteiger', 'Arme mit leicht gebeugten Ellbogen weit öffnen, bis die Brust gedehnt wird, und im Bogen wieder schließen.'],
  ['butterfly', 'Butterfly-Maschine', 'Brust', 'Maschine', 'Einsteiger', 'Aufrecht sitzen, Griffe vor der Brust zusammenführen und langsam wieder öffnen.'],
  ['kabelzug-fliegende', 'Kabelzug-Fliegende', 'Brust', 'Kabelzug', 'Fortgeschritten', 'Zwischen zwei Kabelzügen stehen und die Griffe in einem Bogen vor der Brust zusammenführen.'],
  ['liegestuetze', 'Liegestütze', 'Brust', 'Körpergewicht', 'Einsteiger', 'Körper in einer Linie halten, Brust zum Boden senken und kraftvoll hochdrücken.'],
  ['dips', 'Dips', 'Brust', 'Körpergewicht', 'Fortgeschritten', 'An parallelen Barren stützen, Oberkörper leicht nach vorn neigen, tief absenken und wieder hochdrücken.'],
  // Rücken
  ['kreuzheben', 'Kreuzheben', 'Rücken', 'Langhantel', 'Profi', 'Stange nah am Schienbein, Rücken gerade, mit den Beinen anheben und die Hüfte vollständig strecken.'],
  ['langhantelrudern', 'Langhantelrudern', 'Rücken', 'Langhantel', 'Fortgeschritten', 'Oberkörper vorgebeugt, Rücken gerade, Stange zum Bauchnabel ziehen und kontrolliert absenken.'],
  ['kh-rudern', 'Einarmiges Kurzhantelrudern', 'Rücken', 'Kurzhantel', 'Einsteiger', 'Eine Hand und ein Knie auf der Bank abstützen, die Hantel zur Hüfte ziehen.'],
  ['klimmzuege', 'Klimmzüge', 'Rücken', 'Körpergewicht', 'Profi', 'Aus dem langen Hang das Kinn über die Stange ziehen, Schulterblätter nach unten führen.'],
  ['latziehen', 'Latzug', 'Rücken', 'Kabelzug', 'Einsteiger', 'Die Stange mit weitem Griff zur oberen Brust ziehen, Oberkörper leicht zurückgelehnt.'],
  ['rudern-kabel', 'Sitzendes Kabelrudern', 'Rücken', 'Kabelzug', 'Einsteiger', 'Aufrecht sitzen, den Griff zum Bauch ziehen und Schulterblätter zusammenführen.'],
  ['rudermaschine', 'Rudermaschine', 'Rücken', 'Maschine', 'Einsteiger', 'Brust gegen das Polster, Griffe zum Körper ziehen und langsam zurückführen.'],
  ['hyperextensions', 'Rückenstrecker', 'Rücken', 'Körpergewicht', 'Einsteiger', 'Auf der Bank den Oberkörper kontrolliert senken und bis zur Körperlinie wieder anheben.'],
  // Schultern
  ['schulterdruecken', 'Schulterdrücken mit Langhantel', 'Schultern', 'Langhantel', 'Fortgeschritten', 'Stange vor der Brust halten und über den Kopf drücken, Rumpf fest anspannen.'],
  ['kh-schulterdruecken', 'Kurzhantel-Schulterdrücken', 'Schultern', 'Kurzhantel', 'Einsteiger', 'Sitzend oder stehend die Hanteln von Schulterhöhe nach oben drücken.'],
  ['seitheben', 'Seitheben', 'Schultern', 'Kurzhantel', 'Einsteiger', 'Die Arme mit leicht gebeugten Ellbogen seitlich bis auf Schulterhöhe anheben.'],
  ['frontheben', 'Frontheben', 'Schultern', 'Kurzhantel', 'Einsteiger', 'Hanteln mit gestreckten Armen vor dem Körper bis auf Schulterhöhe heben.'],
  ['reverse-fliegende', 'Reverse Fliegende', 'Schultern', 'Kurzhantel', 'Einsteiger', 'Vorgebeugt die Arme seitlich anheben, um die hintere Schulter zu trainieren.'],
  ['face-pulls', 'Face Pulls', 'Schultern', 'Kabelzug', 'Einsteiger', 'Das Seil auf Gesichtshöhe zu sich ziehen, Ellbogen hoch und die Hände auseinander.'],
  ['arnold-press', 'Arnold Press', 'Schultern', 'Kurzhantel', 'Fortgeschritten', 'Beim Hochdrücken die Handflächen von zu dir gedreht nach vorn drehen.'],
  ['aufrechtes-rudern', 'Aufrechtes Rudern', 'Schultern', 'Langhantel', 'Fortgeschritten', 'Stange eng am Körper bis zur Brust ziehen, Ellbogen führen die Bewegung.'],
  // Bizeps
  ['langhantelcurls', 'Langhantelcurls', 'Bizeps', 'Langhantel', 'Einsteiger', 'Ellbogen am Körper fixieren und die Stange nach oben curlen, kontrolliert absenken.'],
  ['kh-curls', 'Kurzhantelcurls', 'Bizeps', 'Kurzhantel', 'Einsteiger', 'Abwechselnd oder gleichzeitig die Hanteln beugen, ohne zu schwingen.'],
  ['hammercurls', 'Hammercurls', 'Bizeps', 'Kurzhantel', 'Einsteiger', 'Mit neutralem Griff, Daumen nach oben, die Hanteln zur Schulter führen.'],
  ['scott-curls', 'Scott-Curls', 'Bizeps', 'Maschine', 'Einsteiger', 'Oberarme auf dem Polster ablegen und die Griffe nach oben curlen.'],
  ['kabel-curls', 'Kabelcurls', 'Bizeps', 'Kabelzug', 'Einsteiger', 'Am unteren Kabelzug mit konstantem Widerstand beugen.'],
  // Trizeps
  ['trizepsdruecken', 'Trizepsdrücken am Kabel', 'Trizeps', 'Kabelzug', 'Einsteiger', 'Ellbogen am Körper, die Stange nach unten drücken bis die Arme gestreckt sind.'],
  ['french-press', 'French Press', 'Trizeps', 'Langhantel', 'Fortgeschritten', 'Liegend die Stange hinter den Kopf senken und über Kopf wieder strecken.'],
  ['enges-bankdruecken', 'Enges Bankdrücken', 'Trizeps', 'Langhantel', 'Fortgeschritten', 'Mit engem Griff drücken, Ellbogen nah am Körper führen.'],
  ['kickbacks', 'Trizeps-Kickbacks', 'Trizeps', 'Kurzhantel', 'Einsteiger', 'Vorgebeugt den Oberarm fixieren und den Unterarm nach hinten strecken.'],
  ['baenkdips', 'Bankdips', 'Trizeps', 'Körpergewicht', 'Einsteiger', 'Mit den Händen an einer Bank abstützen, Gesäß absenken und hochdrücken.'],
  // Beine
  ['kniebeuge', 'Kniebeuge', 'Beine', 'Langhantel', 'Fortgeschritten', 'Stange auf dem oberen Rücken, Hüfte nach hinten und unten, Knie über den Füßen, dann aufrichten.'],
  ['frontkniebeuge', 'Frontkniebeuge', 'Beine', 'Langhantel', 'Profi', 'Stange vorn auf den Schultern halten und mit aufrechtem Oberkörper tief beugen.'],
  ['beinpresse', 'Beinpresse', 'Beine', 'Maschine', 'Einsteiger', 'Füße schulterbreit auf die Platte, Knie beugen und kontrolliert wegdrücken.'],
  ['ausfallschritte', 'Ausfallschritte', 'Beine', 'Kurzhantel', 'Einsteiger', 'Großer Schritt nach vorn, hinteres Knie Richtung Boden senken, zurückdrücken.'],
  ['bulgarian-split-squat', 'Bulgarian Split Squat', 'Beine', 'Kurzhantel', 'Fortgeschritten', 'Hinteren Fuß auf einer Bank ablegen und mit dem vorderen Bein tief beugen.'],
  ['beinstrecker', 'Beinstrecker', 'Beine', 'Maschine', 'Einsteiger', 'Sitzend die Unterschenkel nach oben strecken und langsam absenken.'],
  ['beinbeuger', 'Beinbeuger', 'Beine', 'Maschine', 'Einsteiger', 'Die Fersen zum Gesäß ziehen und langsam zurückführen.'],
  ['rumaenisches-kreuzheben', 'Rumänisches Kreuzheben', 'Beine', 'Langhantel', 'Fortgeschritten', 'Mit fast gestreckten Beinen die Hüfte nach hinten schieben, Stange nah am Bein führen.'],
  ['goblet-squat', 'Goblet Squat', 'Beine', 'Kettlebell', 'Einsteiger', 'Kettlebell vor der Brust halten und tief in die Kniebeuge gehen.'],
  ['kettlebell-swing', 'Kettlebell Swing', 'Beine', 'Kettlebell', 'Fortgeschritten', 'Mit explosivem Hüftstoß die Kettlebell auf Brusthöhe schwingen.'],
  // Gesäß
  ['hip-thrust', 'Hip Thrust', 'Gesäß', 'Langhantel', 'Fortgeschritten', 'Oberer Rücken an der Bank, Hüfte kraftvoll nach oben strecken und oben anspannen.'],
  ['glute-bridge', 'Glute Bridge', 'Gesäß', 'Körpergewicht', 'Einsteiger', 'Auf dem Rücken liegend die Hüfte anheben, bis Schultern, Hüfte und Knie eine Linie bilden.'],
  ['kabel-kickback', 'Kabel-Kickback', 'Gesäß', 'Kabelzug', 'Einsteiger', 'Das Bein am Kabel gestreckt nach hinten drücken.'],
  // Bauch
  ['crunches', 'Crunches', 'Bauch', 'Körpergewicht', 'Einsteiger', 'Auf dem Rücken liegend den Oberkörper leicht einrollen, Nacken entspannt lassen.'],
  ['plank', 'Plank', 'Bauch', 'Körpergewicht', 'Einsteiger', 'Auf den Unterarmen stützen und den Körper als gerade Linie halten. Als Satz mit Sekunden zählen.'],
  ['beinheben', 'Hängendes Beinheben', 'Bauch', 'Körpergewicht', 'Fortgeschritten', 'Am Reck hängend die Beine gestreckt oder gebeugt anheben, ohne zu schwingen.'],
  ['russian-twists', 'Russian Twists', 'Bauch', 'Körpergewicht', 'Einsteiger', 'Mit angehobenen Füßen den Oberkörper abwechselnd zu beiden Seiten drehen.'],
  ['ab-wheel', 'Ab-Wheel', 'Bauch', 'Körpergewicht', 'Profi', 'Aus dem Kniestand das Rad kontrolliert nach vorn rollen und wieder zurückziehen.'],
  // Waden und Unterarme
  ['wadenheben-stehend', 'Wadenheben stehend', 'Waden', 'Maschine', 'Einsteiger', 'Auf den Fußballen hochdrücken, oben kurz halten und tief absenken.'],
  ['wadenheben-sitzend', 'Wadenheben sitzend', 'Waden', 'Maschine', 'Einsteiger', 'Sitzend die Fersen anheben und langsam absenken.'],
  ['handgelenkcurls', 'Handgelenkcurls', 'Unterarme', 'Kurzhantel', 'Einsteiger', 'Unterarme auflegen und die Hanteln nur aus dem Handgelenk beugen.'],
  ['farmers-walk', 'Farmers Walk', 'Unterarme', 'Kurzhantel', 'Einsteiger', 'Mit schweren Hanteln aufrecht eine Strecke gehen.'],
];

export const EXERCISES: readonly Exercise[] = ROWS.map(([id, name, muscleGroup, equipment, difficulty, instructions]) => ({
  id,
  name,
  muscleGroup,
  equipment,
  difficulty,
  instructions,
}));

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'Brust',
  'Rücken',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Beine',
  'Gesäß',
  'Bauch',
  'Waden',
  'Unterarme',
];

export const EQUIPMENT: readonly Equipment[] = [
  'Langhantel',
  'Kurzhantel',
  'Maschine',
  'Kabelzug',
  'Körpergewicht',
  'Kettlebell',
];

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}
