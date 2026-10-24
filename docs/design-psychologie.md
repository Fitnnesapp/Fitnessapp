# Psychologische Grundlagen des App-Designs

Stand: 24.10.2026. Dieses Dokument begründet, warum Start-Bildschirm, Trainingsplan, Challenges und Events so
gestaltet sind. Leitlinie aus dem Entwicklungsplan: motivieren ohne künstlichen Druck, keine manipulativen Muster.

## Studien und was daraus in der App wurde

| Studie | Kernergebnis | Umsetzung in der App |
|---|---|---|
| **Gollwitzer & Sheeran (2006)**, Meta-Analyse zu Implementation Intentions | Wenn-Dann-Pläne („Wenn Situation X, dann tue ich Y“) verbessern die Zielerreichung deutlich; über 94 Tests hinweg ein mittlerer Effekt von etwa d = 0,65. | Der Trainingsplan fragt nach festen Tagen und Tageszeit. Jede Einheit bekommt einen Satz wie „Wenn es Montag abends ist, mache ich Kraft: Ganzkörper A.“ |
| **Dai, Milkman & Riis (2014)**, Fresh-Start-Effekt | Zu Beginn einer neuen Woche, eines Monats oder Jahres und nach Geburtstagen gehen Menschen öfter ins Studio und setzen sich häufiger Ziele. | Der Plan kann bewusst „am Montag“ starten. Die Challenges beginnen an Monats- und Jahresanfängen (Winter Arc am 1. Oktober, 100 km im November, Neustart 2027). |
| **Milkman et al. (2021)**, Megastudie mit rund 61.000 Studio-Mitgliedern und 54 Interventionen | Etwa 45 % der Programme steigerten die Studio-Besuche (um 9–27 %). Am besten wirkten kleine Belohnungen für die Rückkehr nach einem verpassten Training. Nur wenige Effekte hielten nach Programmende an. | Nach einer verpassten Plan-Einheit zeigt der Start-Bildschirm einen „Comeback-Tag“ mit ermutigendem Text statt Vorwürfen. Weil Effekte verblassen, sind Plan, Serie und Challenges dauerhafte Bausteine statt einer einmaligen Aktion. |
| **Lally et al. (2010)**, Gewohnheitsbildung | Bis ein Verhalten automatisch wird, vergingen im Median 66 Tage (Spanne 18–254). Ein einzelner verpasster Tag störte die Gewohnheitsbildung kaum. | Serie mit Freezes, damit ein verpasster Tag nicht alles nimmt. Der Winter Arc dauert rund drei Monate und deckt damit den typischen Zeitraum ab. Die 30-Tage-Challenge erklärt, dass ein verpasster Tag kein Problem ist. |
| **Kivetz, Urminsky & Zheng (2006)**, Goal-Gradient | Je näher ein Ziel rückt, desto mehr Einsatz zeigen Menschen (Kaffee-Stempelkarte, Song-Bewertungen). | Fortschrittsringe und -balken für Wochenziel, Challenges und das nächste Abzeichen; Texte wie „Nur noch 1 Tag bis zu deinem Wochenziel“. |
| **Nunes & Drèze (2006)**, Endowed-Progress-Effekt | Eine Stempelkarte mit 2 von 10 geschenkten Stempeln wurde deutlich häufiger vollendet (34 % gegenüber 19 % bei 8 nötigen Stempeln ohne Vorsprung). | Der Fortschrittsbalken im Plan-Einstieg zeigt beim Öffnen schon einen Abschnitt. In Challenges zählen Workouts seit dem Start sofort mit, wer spät einsteigt, sieht seinen echten Vorsprung. |
| **Mazéas et al. (2022)**, Meta-Analyse zu Gamification und Bewegung (16 RCTs, 2.407 Teilnehmende) | Kleiner bis mittlerer Effekt (g ≈ 0,42), etwa 1.600 Schritte mehr pro Tag; die Wirkung nimmt nach Programmende ab, die Studienqualität ist gemischt. | Gamification (Abzeichen, Etappen, Serie) ist Ergänzung, nicht Kern. Der Kern ist der persönliche Plan. |

## Weitere Gestaltungsentscheidungen

- **Wahlfreiheit statt Vorgabe:** Ziele und Orte lassen sich kombinieren, jeder Tag lässt sich selbst belegen. Wer seinen Plan mitgestaltet, hält ihn eher durch.
- **Wenige Optionen pro Frage:** höchstens fünf Antworten, mit markierter Empfehlung, damit die Entscheidung leicht fällt.
- **Ein Ziel pro Bildschirm:** Der Start-Bildschirm zeigt zuerst genau eine nächste Handlung („Los geht's“), dann den Fortschritt.
- **Suche statt Menü-Labyrinth:** Jede Funktion ist über die Suche mit Alltagssprache erreichbar.
- **Belohnungsmomente:** Nach dem Erstellen des Plans und bei neuen Abzeichen gibt es einen sichtbaren Erfolgsmoment.

## Bewusst vermieden

- Keine Mechaniken, die auf Sucht zielen (endloses Scrollen, Verlustangst, zufällige Belohnungen nach Spielautomaten-Prinzip). Ziel ist eine Gewohnheit, die Menschen guttut, nicht maximale Bildschirmzeit.

- Keine künstliche Dringlichkeit oder Countdowns mit Verlustangst, keine Schuldgefühle bei Pausen.
- Keine erfundenen Zahlen über andere Nutzer (die App hat keinen Server und keine Ranglisten).
- Vorschläge und Pläne führen nie an eine Paywall: ohne Premium wählt der Plan nur kostenlose Programme.
- Ruhetage werden als Teil des Trainings dargestellt.

## Quellen

- Gollwitzer, P. M. & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38*, 69–119.
- Dai, H., Milkman, K. L. & Riis, J. (2014). The fresh start effect: Temporal landmarks motivate aspirational behavior. *Management Science, 60*(10), 2563–2582.
- Milkman, K. L. et al. (2021). Megastudies improve the impact of applied behavioural science. *Nature, 600*, 478–483.
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W. & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*(6), 998–1009.
- Kivetz, R., Urminsky, O. & Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research, 43*(1), 39–58.
- Nunes, J. C. & Drèze, X. (2006). The endowed progress effect. *Journal of Consumer Research, 32*(4), 504–512.
- Mazéas, A., Duclos, M., Pereira, B. & Chalabaev, A. (2022). Evaluating the effectiveness of gamification on physical activity: Systematic review and meta-analysis of randomized controlled trials. *Journal of Medical Internet Research, 24*(1), e26779.

## Pflege

- **Events:** `src/data/events.json` auf `main` bearbeiten. Die App lädt die Liste beim nächsten Öffnen (höchstens alle 12 Stunden). Termine vor dem Eintragen beim Veranstalter prüfen; die HYROX-Termine sind aus einer Übersicht übernommen und sollten bestätigt werden.
- **Challenges:** `src/data/challenges.ts`. Sie sind Teil der App und brauchen ein App-Update. Abgelaufene Challenges verschwinden automatisch.
