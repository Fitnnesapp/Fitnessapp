import { Canvas } from '@react-three/fiber';
import { View } from 'react-native';

import { KettlebellHero } from '@/components/illustrations/kettlebell-hero';
import { SceneBoundary } from '@/components/three/scene-boundary';
import { SoftShadow } from '@/components/three/soft-shadow';
import { useSpin } from '@/components/three/use-spin';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

type Kettlebell3DProps = {
  size?: number;
};

const LIME = '#C8F03C';
const LIME_DARK = '#7E9E14';
const IRON = '#2A2F35';

/** Kettlebell aus Grundformen: Kugel, halber Torus als Griff, flacher Standfuß. */
function KettlebellModel({ reduceMotion }: { reduceMotion: boolean }) {
  const { group, handlers } = useSpin({ speed: 0.5, bob: 0.06, reduceMotion });

  return (
    <group ref={group} {...handlers}>
      {/* Unsichtbare Fläche zum Greifen, größer als das Modell */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Kugel: leicht metallisch, Klarlack für den Glanz */}
      <mesh position={[0, -0.15, 0]} scale={[1, 0.96, 1]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshPhysicalMaterial color={LIME} metalness={0.25} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.15} />
      </mesh>
      {/* Griff: halber Torus, die Enden stecken in der Kugel */}
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.6, 0.15, 32, 64, Math.PI]} />
        <meshPhysicalMaterial color={LIME_DARK} metalness={0.35} roughness={0.4} clearcoat={0.5} />
      </mesh>
      {/* Hörner: Übergang vom Griff in die Kugel */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 32]} />
          <meshPhysicalMaterial color={LIME_DARK} metalness={0.35} roughness={0.4} />
        </mesh>
      ))}
      {/* Standfuß */}
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[0.52, 0.56, 0.1, 48]} />
        <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Echte 3D-Kettlebell zum Drehen mit dem Finger. Ohne WebGL erscheint die flache Illustration.
 * Bei "Bewegung reduzieren" dreht sie sich nicht von allein.
 */
export function Kettlebell3D({ size = 240 }: Kettlebell3DProps) {
  const reduceMotion = useReduceMotion();

  return (
    <SceneBoundary fallback={<KettlebellHero size={size} />}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel="3D-Kettlebell, zum Drehen ziehen">
        <Canvas flat camera={{ position: [0, 0.5, 4.4], fov: 38 }} gl={{ antialias: true, alpha: true }} style={{ flex: 1 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[-3, 4, 4]} intensity={2.2} />
          <directionalLight position={[3, 1, -3]} intensity={1.2} color={LIME} />
          <pointLight position={[0, -2, 3]} intensity={0.6} />
          <KettlebellModel reduceMotion={reduceMotion} />
          <SoftShadow y={-1.2} radius={1.5} opacity={0.45} />
        </Canvas>
      </View>
    </SceneBoundary>
  );
}
