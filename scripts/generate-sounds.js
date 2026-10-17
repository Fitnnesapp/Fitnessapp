// Erzeugt die Signaltöne für den Home-Workout-Player (reine Sinustöne, keine Fremdlizenz).
// Aufruf: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

function writeTone(file, frequency, seconds) {
  const samples = Math.floor(SAMPLE_RATE * seconds);
  const data = Buffer.alloc(samples * 2);

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    // kurzes Ein- und Ausblenden verhindert Knacken
    const fade = Math.min(1, i / 200, (samples - i) / 400);
    data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * t) * 0.6 * fade * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(file, Buffer.concat([header, data]));
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeTone(path.join(dir, 'beep-short.wav'), 880, 0.15);
writeTone(path.join(dir, 'beep-long.wav'), 1320, 0.5);
