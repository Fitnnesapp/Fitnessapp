import { useMemo } from 'react';
import { DataTexture, RGBAFormat } from 'three';

type SoftShadowProps = {
  y: number;
  radius: number;
  opacity?: number;
};

/** Radialer Verlauf als Textur, im Code erzeugt (funktioniert ohne Browser-Canvas, also auch auf dem Handy). */
function radialTexture(size = 64): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      // Weicher Abfall zum Rand (Smoothstep)
      const alpha = 1 - d * d * (3 - 2 * d);
      const i = (y * size + x) * 4;
      // three.js liest alphaMap aus dem Grünkanal, daher alle Kanäle gleich setzen
      const value = Math.round(alpha * 255);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = value;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/** Weicher Kontaktschatten unter einem Objekt, ohne aufwendiges Schatten-Rendering (schont den Akku). */
export function SoftShadow({ y, radius, opacity = 0.35 }: SoftShadowProps) {
  const texture = useMemo(() => radialTexture(), []);

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial color="#000000" alphaMap={texture} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
