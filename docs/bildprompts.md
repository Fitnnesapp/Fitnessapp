# Bild-Prompts für die Fitnessapp

Stand: 24.10.2026. Zwölf Fotos für die App, erzeugt mit einem KI-Bildgenerator (z. B. ChatGPT, Adobe Firefly, Midjourney).
Solange ein Foto fehlt, zeigt die App an dieser Stelle die Vektorgrafik. Fertige Bilder einfach im Chat hochladen:
Claude verkleinert sie, legt sie unter `assets/photos/` ab und trägt sie in `src/data/photos.ts` ein.

## So bekommst du einen einheitlichen Look

1. **Immer denselben Stil-Zusatz** ans Ende jedes Prompts hängen (unten).
2. **Ein Werkzeug für alle Bilder** nutzen, gleiche Einstellungen (bei Midjourney z. B. gleicher `--style`/`--sref`).
3. **Pro Motiv 3–4 Varianten** erzeugen und die natürlichste auswählen. Auf Hände, Finger, Gewichte und Schuhe achten,
   dort passieren KI-Fehler am häufigsten.
4. **Vielfalt:** Die Motive zeigen bewusst verschiedene Altersgruppen, Geschlechter und Körpertypen. So fühlen sich mehr
   Menschen angesprochen.

**Stil-Zusatz (an jeden Prompt anhängen):**

> Photorealistic editorial sports photography, full-frame camera, 35mm lens, natural light, shallow depth of field,
> authentic candid moment, real skin texture, subtle film grain, dark muted tones with a single lime-green accent
> (#C8F03C) in clothing or equipment. No text, no logos, no brand names, no watermarks.

**Negativ-Prompt (falls das Werkzeug ihn unterstützt):**

> text, letters, logo, brand, watermark, extra fingers, deformed hands, plastic skin, oversaturated, cartoon, 3d render

## Formate

| Art | Seitenverhältnis | Mindestgröße | Komposition |
|---|---|---|---|
| Ziel-Bilder (`goal-…`) | 1:1 | 800 × 800 px | Motiv mittig, wird klein als Vorschaubild gezeigt |
| Start-Karte (`hero-…`) | 16:9 | 1600 × 900 px | Person **oben rechts**, unteres Drittel ruhig und dunkel, dort steht Text |
| Challenge-Titel (`challenge-…`) | 16:9 | 1600 × 900 px | weite, stimmungsvolle Szene, Motiv in der Mitte |

## Die zwölf Motive

### Ziele im Fragebogen (1:1)

| Datei | Prompt (vor den Stil-Zusatz setzen) |
|---|---|
| `goal-muskeln.jpg` | Close-up of a woman in her late 20s gripping a loaded barbell in a dark modern gym, chalk dust in the air, focused expression, soft window rim light, lime-green wrist wraps |
| `goal-ausdauer.jpg` | Man in his 30s running mid-stride across an empty city bridge at sunrise, breath visible in the cold air, slight motion blur on the legs, lime-green running shoes |
| `goal-abnehmen.jpg` | Woman in her 40s doing a kettlebell swing in a bright functional training space, light sweat, determined smile, lime-green kettlebell |
| `goal-fitness.jpg` | Three friends of different ages laughing while stretching together on a park lawn after a workout, golden hour, one wears a lime-green top |
| `goal-beweglichkeit.jpg` | Man in his 50s holding a deep lunge stretch on a yoga mat at home next to a large window, calm morning light, plants, lime-green mat |

### Start-Karte „Heute für dich“ (16:9)

| Datei | Prompt |
|---|---|
| `hero-kraft.jpg` | Athletic woman re-racking a heavy barbell after a squat set in a moody industrial gym, subject in the upper right third, dark empty floor in the lower third, lime-green lifting belt |
| `hero-lauf.jpg` | Female runner on a forest trail in autumn, low sun backlight through the trees, leaves in the air, subject in the upper right third, darker path in the lower third, lime-green jacket |
| `hero-home.jpg` | Young man doing push-ups on a mat in a minimalist living room at dusk, warm lamp light, subject in the upper right third, calm dark floor in the lower third, lime-green mat |

### Challenge-Titelbilder (16:9)

| Datei | Prompt |
|---|---|
| `challenge-winter-arc.jpg` | Lone runner in winter gear on a snowy mountain road at blue hour, breath vapor, distant peaks, cinematic wide shot, lime-green jacket as the only color accent |
| `challenge-100k.jpg` | Low-angle shot of running shoes splashing through a puddle on a city street in November rain, autumn leaves on the wet asphalt, lime-green shoelaces |
| `challenge-neustart.jpg` | Woman tying her running shoes on a doorstep at dawn on New Year's morning, city skyline in soft mist, fresh-start mood, lime-green beanie |
| `challenge-gewohnheit.jpg` | Close-up of a hand placing a kettlebell back on a rack in an early-morning gym, rows of equipment softly out of focus, sense of daily routine, lime-green kettlebell handle |

## Rechtliches (kein Rechtsrat)

- Vor der Veröffentlichung in den App Stores die **Nutzungsbedingungen des Bildgenerators** prüfen: Kommerzielle Nutzung
  ist je nach Werkzeug und Tarif unterschiedlich geregelt (bei manchen nur mit bezahltem Abo).
- **Keine erkennbaren realen Personen** und keine Marken nachbilden lassen.
- In der App nicht behaupten, es seien echte Nutzerinnen oder Nutzer.
