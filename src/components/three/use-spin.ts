import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

type SpinOptions = {
  /** Umdrehungen pro Sekunde (in Radiant), solange niemand zieht */
  speed: number;
  /** Höhe des sanften Schwebens */
  bob: number;
  reduceMotion: boolean;
};

/**
 * Dreht ein 3D-Objekt langsam von selbst und lässt es mit dem Finger drehen.
 * Die Neigung nach oben/unten ist begrenzt, damit das Objekt nie "kippt".
 * Nur innerhalb eines <Canvas> verwenden.
 */
export function useSpin({ speed, bob, reduceMotion }: SpinOptions) {
  const group = useRef<Group>(null);
  const spin = useRef({ x: 0.15, y: 0, dragging: false, lastX: 0, lastY: 0 });

  useFrame((state, delta) => {
    const g = group.current;
    const s = spin.current;
    if (!g) return;
    if (!s.dragging && !reduceMotion) s.y += delta * speed;
    g.rotation.y += (s.y - g.rotation.y) * 0.15;
    g.rotation.x += (s.x - g.rotation.x) * 0.15;
    g.position.y = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.5) * bob;
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    spin.current.dragging = true;
    spin.current.lastX = e.pointer.x;
    spin.current.lastY = e.pointer.y;
  };
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    const s = spin.current;
    if (!s.dragging) return;
    s.y += (e.pointer.x - s.lastX) * 3;
    s.x = Math.max(-0.6, Math.min(0.6, s.x - (e.pointer.y - s.lastY) * 2));
    s.lastX = e.pointer.x;
    s.lastY = e.pointer.y;
  };
  const onPointerUp = () => {
    spin.current.dragging = false;
  };

  return { group, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerOut: onPointerUp } };
}
