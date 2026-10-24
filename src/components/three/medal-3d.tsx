import { Canvas } from '@react-three/fiber';
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Shape } from 'three';

import { SceneBoundary } from '@/components/three/scene-boundary';
import { useSpin } from '@/components/three/use-spin';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

type Medal3DProps = {
  size?: number;
  /** Flache Darstellung, falls 3D nicht verfügbar ist */
  fallback: ReactNode;
};

const LIME = '#C8F03C';
const LIME_DEEP = '#8FB21E';
const IRON = '#2A2F35';

/** Fünfzackiger Stern als Fläche, wird zur Prägung extrudiert. */
function starShape(outer: number, inner: number): Shape {
  const shape = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function MedalModel({ reduceMotion }: { reduceMotion: boolean }) {
  const { group, handlers } = useSpin({ speed: 0.9, bob: 0.05, reduceMotion });
  const star = useMemo(() => starShape(0.5, 0.22), []);

  return (
    <group ref={group} {...handlers}>
      {/* Unsichtbare Fläche zum Greifen */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Band */}
      <mesh position={[-0.32, 1.25, -0.02]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.36, 1.2, 0.04]} />
        <meshStandardMaterial color={IRON} roughness={0.8} />
      </mesh>
      <mesh position={[0.32, 1.25, -0.04]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.36, 1.2, 0.04]} />
        <meshStandardMaterial color={LIME_DEEP} roughness={0.7} />
      </mesh>
      {/* Münze: liegt aufrecht, Vorderseite zur Kamera */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.16, 64]} />
        <meshPhysicalMaterial color={LIME} metalness={0.3} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.1} />
      </mesh>
      {/* Rand */}
      <mesh>
        <torusGeometry args={[0.98, 0.07, 24, 96]} />
        <meshPhysicalMaterial color={LIME_DEEP} metalness={0.4} roughness={0.3} clearcoat={0.6} />
      </mesh>
      {/* Geprägter Stern auf beiden Seiten */}
      {[0.08, -0.08].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
          <extrudeGeometry args={[star, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]} />
          <meshPhysicalMaterial color="#F4FFC2" metalness={0.3} roughness={0.25} clearcoat={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Drehbare 3D-Medaille für erreichte Abzeichen. */
export function Medal3D({ size = 180, fallback }: Medal3DProps) {
  const reduceMotion = useReduceMotion();

  return (
    <SceneBoundary fallback={fallback}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel="3D-Medaille, zum Drehen ziehen">
        <Canvas flat camera={{ position: [0, 0.3, 4.4], fov: 40 }} gl={{ antialias: true, alpha: true }} style={{ flex: 1 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[-3, 4, 5]} intensity={2.4} />
          <directionalLight position={[3, -1, 2]} intensity={0.9} color={LIME} />
          <MedalModel reduceMotion={reduceMotion} />
        </Canvas>
      </View>
    </SceneBoundary>
  );
}
