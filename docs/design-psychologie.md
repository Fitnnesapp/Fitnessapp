# Psychologische Grundlagen des App-Designs

Stand: 06.11.2026 (erstmals 24.10.2026). Dieses Dokument begründet, warum Start-Bildschirm, Trainingsplan, Challenges und Events so
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

## Redesign 2.0 (ab 25.10.2026): starke, faire Bindung

Entscheidung des Nutzers: Die App soll stärker binden, im sportlich-kraftvollen Stil (große, fette Zahlen, starke
Kontraste, Limette als einziger Akzent). Leitlinie: **alles, was nachweislich bindet und dem Menschen nützt; nichts,
was auf Sucht oder Verlustangst zielt.** Der Abschnitt „Bewusst vermieden“ gilt unverändert weiter.

| Prinzip | Grundlage | Umsetzung |
|---|---|---|
| **Gewohnheitsschleife** | Auslöser, Handlung, Belohnung; Gewohnheiten entstehen durch Wiederholung im gleichen Kontext (Lally et al. 2010, Wood & Neal 2007). | Oben steht immer genau eine nächste Handlung mit einem Tipp. Nach jeder Einheit ein sichtbarer Erfolgsmoment. |
| **Identität statt Aufgabe** | Substantiv statt Verb („Wähler sein“ statt „wählen“) erhöhte die Beteiligung messbar (Bryan, Walton, Rogers & Dweck 2011). | Kopfzeile zeigt „Team Lauf“, „Team Kraft“ oder „Team Allround“ aus den eigenen Einheiten der letzten 90 Tage. |
| **Sichtbarer Fortschritt** | Fortschritt ist der stärkste Motivator im Alltag („Progress Principle“, Amabile & Kramer 2011); Goal-Gradient (Kivetz et al. 2006). | Große Wochenzahlen (Einheiten, Zeit, Distanz), Wochenziel-Ring, Vergleich mit der Vorwoche bis zum gleichen Zeitpunkt. |
| **Positiver Vergleich mit sich selbst** | Selbstbezogenes Feedback stärkt das Kompetenzerleben (Selbstbestimmungstheorie, Ryan & Deci 2000); Vergleiche mit anderen können demotivieren. | Vergleich nur mit der eigenen Vorwoche, positiv formuliert; weniger als letzte Woche wird neutral genannt, nie als Verlust. |
| **Kompetenz feiern** | Belohnung für tatsächliche Leistung, nicht zufällig (Gegenteil von variablen Belohnungen). | Rekorde und Abzeichen erscheinen genau dann, wenn sie erreicht wurden. |

**Fahrplan (je ein Schritt):** 1. Start-Bildschirm und Design-Bausteine · 2. Training-Bereich · 3. Abschluss einer Einheit
(Erfolgsmoment, Rekorde) · 4. Fortschritt mit Wochenrückblick · 5. Profil · 6. Erinnerung zur selbst gewählten Uhrzeit.
Entdecken bleibt im Aufbau unverändert, übernimmt aber gemeinsame Bausteine wie Schrift und Karten.

## Trainingswissenschaft hinter dem Ausbau (November 2026)

| Grundlage | Kernaussage | Umsetzung in der App |
|---|---|---|
| **ACSM-Positionspapier (2009)**, Progression im Krafttraining | Progressive Überlastung ist der zentrale Reiz; Grundübungen zuerst, 1 bis 3 Minuten Pause je nach Last. | Aufbau der fertigen Kraft-Workouts, Pausen je Übung, Ruhezeit startet automatisch mit dieser Pause. |
| **Plotkin et al. (2022)**, Last- vs. Wiederholungssteigerung | Mehr Wiederholungen und mehr Gewicht führen zu ähnlichen Zuwächsen. | Progressions-Coach: erst eine Wiederholung mehr, ab der Obergrenze mehr Gewicht (doppelte Progression). |
| **Schoenfeld, Ogborn & Krieger (2016)**, Trainingshäufigkeit | Zwei Einheiten pro Muskel und Woche wirken besser als eine. | „Heute empfohlen“ wählt das Workout, dessen Hauptmuskeln am längsten ausgeruht sind. |
| **Schoenfeld, Ogborn & Krieger (2017)**, Dosis-Wirkung des Volumens | Mehr wöchentliche Sätze bringen mehr Muskelzuwachs, als Richtwert etwa 10 und mehr Sätze pro Muskel. | Karte „Sätze pro Muskel“ mit markiertem Bereich 10 bis 20, Hilfsmuskeln zählen halb. |
| **McLester et al. (2003)**, Erholung nach Krafttraining | Nach hartem Training braucht die Leistungsfähigkeit oft 48 bis 72 Stunden. | Muskel-Erholung auf dem Start-Tab als einfache Faustregel, ausdrücklich keine medizinische Aussage. |
| **Riegel (1981)**, Leistung und Ausdauer | Laufzeiten lassen sich mit T2 = T1 × (D2/D1)^1,06 auf andere Strecken umrechnen. | Wettkampf-Prognose aus dem stärksten Lauf der letzten 120 Tage, nur bei sinnvollen Sprüngen, als Schätzung gekennzeichnet. |
| **Seiler (2010)**, Intensitätsverteilung im Ausdauersport | Erfolgreiche Ausdauersportler trainieren rund 80 % locker und 20 % intensiv. | Lauf-Ideen mit Kennzeichnung locker, mittel, hart. |
| **Lally et al. (2010)**, Gewohnheitsbildung | Einzelne ausgelassene Tage schaden der Gewohnheit kaum. | Beständigkeits-Raster zählt aktive Wochen, Ruhetage sind kein Scheitern. |


## Nutzen-Analyse (6. November 2026): Warum Menschen eine Fitness-App behalten

**Frage:** Woran entscheidet sich, ob jemand die App nach der ersten Woche weiter nutzt?
**Antwort der Forschung:** am wahrgenommenen Nutzen. In Modellen zur Technologienutzung ist die wahrgenommene
Nützlichkeit der stärkste Treiber für Nutzung und Weiternutzung (Davis 1989; Bhattacherjee 2001). Motivation hält
länger, wenn die Gründe selbst gewählt sind (Sheldon & Elliot 1999) und Menschen sich als kompetent erleben
(Ryan & Deci 2000). Und eine Handlung passiert, wenn Motivation, Fähigkeit und Auslöser zusammenkommen; jede
Reibung senkt die Wahrscheinlichkeit (Fogg 2009).

### Befund vor diesem Ausbau

| Bereich | Beobachtung | Folge für Nutzer |
|---|---|---|
| Nutzen | Die App zeigte Aktivität (Einheiten, Minuten, km), aber nicht, was sie bringt. | „Schön, 2 Einheiten. Und jetzt?“ Die Zahlen bleiben abstrakt. |
| Erstkontakt | Der Willkommen-Bildschirm zählte Funktionen auf. | Kein klares Versprechen, warum sich die App lohnt. |
| Datensilo | Trainings blieben in der App; Health-App und Aktivitätsringe sahen nichts davon. | Doppelte Erfassung oder Wechsel zu einer anderen App. |
| Reibung | Radfahren war nicht erfassbar; neue Versionen kamen nur per Store-Update. | Ein Teil des Trainings fehlte; Fehlerbehebungen kamen spät an. |
| Motivation in Tiefs | Serie und Abzeichen tragen in guten Wochen; nach einer Pause fehlte ein persönlicher Anker. | Wer eine Woche aussetzt, findet schwer zurück. |

### Umsetzung

| Prinzip | Grundlage | Umsetzung in der App |
|---|---|---|
| **Nutzen statt Zahlen** | Wahrgenommene Nützlichkeit (Davis 1989); Ergebniserwartung (Bandura 1977) | Karte „Dein Gesundheits-Nutzen“: Stand zur WHO-Empfehlung (150 Ausdauerminuten, 2 Krafttage), mit verständlicher Begründung und Quelle |
| **Gewinn-Rahmung** | Bei Vorsorgeverhalten wie Bewegung wirken Gewinn-Botschaften besser als Verlust-Botschaften (Gallagher & Updegraff 2012) | „Bis zur WHO-Empfehlung fehlen noch 55 Minuten, z.B. 30 Min. lockeres Laufen“ statt Warnungen; nie „du hast verpasst“ |
| **Ehrliche Evidenz** | Glaubwürdigkeit ist Voraussetzung für Vertrauen | Die 40 % aus Zhao et al. (BMJ 2020) werden als Zusammenhang aus Beobachtungsdaten erklärt, nicht als Versprechen |
| **Nutzen im Moment der Handlung** | Unmittelbare Rückmeldung verstärkt Verhalten (Gewohnheitsschleife) | Der Erfolgsmoment nach jeder Einheit zeigt den neuen Stand zur WHO-Empfehlung |
| **Klares Nutzenversprechen** | Ergebniserwartung entscheidet über den Start | Willkommen nennt, was man davon hat: Klarheit, Gesundheit, messbarer Fortschritt, Datenschutz |
| **Eigenes Warum** | Selbstkonkordante Ziele werden beharrlicher verfolgt (Sheldon & Elliot 1999) | „Dein Warum“ in eigenen Worten; erscheint nach 3 Tagen Pause und zum Wochenstart, nicht dauernd |
| **Weniger Reibung** | Fähigkeit als Hebel (Fogg 2009) | Radfahren mit GPS und zum Nachtragen; Apple Health überträgt automatisch; Updates laden im Hintergrund |
| **Kein Datensilo** | Nutzen steigt, wenn Daten dort sind, wo man sie braucht | Workouts, Läufe und Radtouren mit Strecke in Apple Health, zählen für die Aktivitätsringe |

### Bewusst nicht gemacht

- Keine Verlust- oder Angstbotschaften über Gesundheit, keine Sterblichkeitszahlen als Druckmittel
- Das Warum erscheint nicht ständig, damit es nicht abstumpft und nicht belehrt
- Apple Health nur schreibend: Die App liest keine Gesundheitsdaten, damit kein Grund für Misstrauen entsteht

### Empfohlene nächste Schritte

1. Android: Health Connect mit derselben Abbildung (`src/lib/logic/health-export.ts`)
2. Erinnerung zur selbst gewählten Uhrzeit an Plan-Tagen (Wenn-Dann-Plan als Benachrichtigung)
3. Auto-Pause beim Laufen und Radfahren (Ampel, Kreuzung)
4. Wochenbilanz am Sonntag: Gesundheits-Nutzen der Woche in einem Satz

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
- Bryan, C. J., Walton, G. M., Rogers, T. & Dweck, C. S. (2011). Motivating voter turnout by invoking the self. *PNAS, 108*(31), 12653–12656.
- Amabile, T. M. & Kramer, S. J. (2011). *The Progress Principle*. Harvard Business Review Press.
- Ryan, R. M. & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68–78.
- Wood, W. & Neal, D. T. (2007). A new look at habits and the habit-goal interface. *Psychological Review, 114*(4), 843–863.
- Mazéas, A., Duclos, M., Pereira, B. & Chalabaev, A. (2022). Evaluating the effectiveness of gamification on physical activity: Systematic review and meta-analysis of randomized controlled trials. *Journal of Medical Internet Research, 24*(1), e26779.
- American College of Sports Medicine (2009). Progression models in resistance training for healthy adults. *Medicine & Science in Sports & Exercise, 41*(3), 687–708.
- Plotkin, D. et al. (2022). Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. *PeerJ, 10*, e14142.
- Schoenfeld, B. J., Ogborn, D. & Krieger, J. W. (2016). Effects of resistance training frequency on measures of muscle hypertrophy: A systematic review and meta-analysis. *Sports Medicine, 46*(11), 1689–1697.
- Schoenfeld, B. J., Ogborn, D. & Krieger, J. W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. *Journal of Sports Sciences, 35*(11), 1073–1082.
- McLester, J. R. et al. (2003). A series of studies: A practical protocol for testing muscular endurance recovery. *Journal of Strength and Conditioning Research, 17*(2), 259–273.
- Riegel, P. S. (1981). Athletic records and human endurance. *American Scientist, 69*(3), 285–290.
- Seiler, S. (2010). What is best practice for training intensity and duration distribution in endurance athletes? *International Journal of Sports Physiology and Performance, 5*(3), 276–291.

## Pflege

- **Events:** `src/data/events.json` auf `main` bearbeiten. Die App lädt die Liste beim nächsten Öffnen (höchstens alle 12 Stunden). Termine vor dem Eintragen beim Veranstalter prüfen; die HYROX-Termine sind aus einer Übersicht übernommen und sollten bestätigt werden.
- **Challenges:** `src/data/challenges.ts`. Sie sind Teil der App und brauchen ein App-Update. Abgelaufene Challenges verschwinden automatisch.
- Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319–340.
- Bhattacherjee, A. (2001). Understanding information systems continuance: An expectation-confirmation model. *MIS Quarterly, 25*(3), 351–370.
- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review, 84*(2), 191–215.
- Sheldon, K. M. & Elliot, A. J. (1999). Goal striving, need satisfaction, and longitudinal well-being: The self-concordance model. *Journal of Personality and Social Psychology, 76*(3), 482–497.
- Fogg, B. J. (2009). A behavior model for persuasive design. *Proceedings of the 4th International Conference on Persuasive Technology*, Article 40.
- Gallagher, K. M. & Updegraff, J. A. (2012). Health message framing effects on attitudes, intentions, and behavior: A meta-analytic review. *Annals of Behavioral Medicine, 43*(1), 101–116.
- Zhao, M., Veeranki, S. P., Magnussen, C. G. & Xi, B. (2020). Recommended physical activity and all cause and cause specific mortality in US adults: prospective cohort study. *BMJ, 370*, m2031.
- World Health Organization (2020). *WHO guidelines on physical activity and sedentary behaviour*. Genf: WHO.
