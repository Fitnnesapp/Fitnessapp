/**
 * Spiegelt einen SVG-Pfad horizontal an der senkrechten Achse x = width / 2.
 * Unterstützt absolute Befehle M, L, Q, C, T, S, H, V und Z (keine relativen Befehle, keine Bögen).
 */
export function mirrorPath(d: string, width: number): string {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const out: string[] = [];
  let command = '';
  let index = 0;
  for (const token of tokens) {
    if (/^[A-Za-z]$/.test(token)) {
      if (token !== token.toUpperCase() && token.toLowerCase() !== 'z') {
        throw new Error(`Relativer Befehl ${token} wird nicht unterstützt`);
      }
      command = token.toUpperCase();
      index = 0;
      out.push(command);
      continue;
    }
    const value = Number(token);
    // Bei H ist jede Zahl ein x-Wert, bei V nie, sonst jede Zahl an gerader Stelle
    const isX = command === 'H' || (command !== 'V' && index % 2 === 0);
    out.push(String(isX ? round(width - value) : value));
    index += 1;
  }
  return out.join(' ');
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
