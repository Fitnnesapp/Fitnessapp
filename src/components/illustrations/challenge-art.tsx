import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Radius } from '@/constants/theme';

type ChallengeArtProps = {
  /** Bildmotiv: Winterlandschaft, Laufstrecke, Neujahr oder Gewohnheits-Ringe */
  variant: 'winter' | 'road' | 'spark' | 'rings';
  height?: number;
};

/** Passendes Motiv zu einer Challenge-ID. */
export function artVariantFor(challengeId: string): ChallengeArtProps['variant'] {
  if (challengeId.startsWith('winter')) return 'winter';
  if (challengeId.includes('km')) return 'road';
  if (challengeId.includes('neujahr') || challengeId.includes('neustart')) return 'spark';
  return 'rings';
}

/**
 * Titelbilder für Challenges, als Vektorgrafik mit räumlicher Wirkung:
 * Ebenen mit Verläufen, Licht und Fluchtpunkt statt flacher Symbole.
 */
export function ChallengeArt({ variant, height = 168 }: ChallengeArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <View style={{ height, borderRadius: Radius.large, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" viewBox="0 0 320 168" preserveAspectRatio="xMidYMid slice" accessibilityRole="image">
        <Defs>
          <LinearGradient id={id('night')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A1022" />
            <Stop offset="1" stopColor="#1B2A3F" />
          </LinearGradient>
          <LinearGradient id={id('dusk')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A1F14" />
            <Stop offset="1" stopColor="#2E3A12" />
          </LinearGradient>
          <LinearGradient id={id('arc')} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#7FA316" />
            <Stop offset="0.5" stopColor="#E6FF7A" />
            <Stop offset="1" stopColor="#7FA316" />
          </LinearGradient>
          <LinearGradient id={id('mountainBack')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3A4C66" />
            <Stop offset="1" stopColor="#1E2B3E" />
          </LinearGradient>
          <LinearGradient id={id('mountainFront')} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#56708F" />
            <Stop offset="1" stopColor="#24344A" />
          </LinearGradient>
          <LinearGradient id={id('road')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2B2F36" />
            <Stop offset="1" stopColor="#11141A" />
          </LinearGradient>
          <RadialGradient id={id('sun')} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F4FFC2" />
            <Stop offset="0.5" stopColor="#C8F03C" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#C8F03C" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={id('orb')} cx="35%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.45" stopColor="#D6F55A" />
            <Stop offset="1" stopColor="#4E690A" />
          </RadialGradient>
        </Defs>

        {variant === 'winter' ? (
          <G>
            <Rect width="320" height="168" fill={url('night')} />
            {[
              [30, 24], [70, 44], [118, 18], [190, 30], [240, 14], [290, 40], [150, 52], [262, 66],
            ].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#FFFFFF" opacity="0.8" />
            ))}
            {/* Der namensgebende Bogen geht hinter den Bergen auf */}
            <Path d="M40 150 A 120 120 0 0 1 280 150" stroke={url('arc')} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.95" />
            <Path d="M40 150 A 120 120 0 0 1 280 150" stroke="#C8F03C" strokeWidth="26" fill="none" opacity="0.12" />
            <Polygon points="0,168 70,78 130,168" fill={url('mountainBack')} />
            <Polygon points="150,168 238,70 320,150 320,168" fill={url('mountainBack')} />
            <Polygon points="40,168 140,58 250,168" fill={url('mountainFront')} />
            {/* Schneekappen mit Licht von links */}
            <Polygon points="140,58 118,82 128,80 136,90 146,78 158,84" fill="#F2F7FF" />
            <Polygon points="238,70 222,88 232,86 240,94 250,84" fill="#E4ECF8" />
            <Polygon points="70,78 56,96 66,93 74,100 82,92" fill="#E4ECF8" />
            <Rect y="150" width="320" height="18" fill="#EAF2FF" opacity="0.9" />
          </G>
        ) : null}

        {variant === 'road' ? (
          <G>
            <Rect width="320" height="168" fill={url('dusk')} />
            <Circle cx="160" cy="62" r="54" fill={url('sun')} />
            {/* Straße mit Fluchtpunkt in der Bildmitte */}
            <Polygon points="148,72 172,72 300,168 20,168" fill={url('road')} />
            {[0, 1, 2, 3].map((i) => {
              const t = i / 4;
              const y = 76 + t * t * 92;
              const w = 1 + t * 5;
              const h = 4 + t * 16;
              return <Rect key={i} x={160 - w / 2} y={y} width={w} height={h} rx={w / 2} fill="#C8F03C" />;
            })}
            <Polygon points="0,96 60,82 120,96 120,168 0,168" fill="#1F2610" opacity="0.9" />
            <Polygon points="200,96 262,80 320,94 320,168 200,168" fill="#1F2610" opacity="0.9" />
          </G>
        ) : null}

        {variant === 'spark' ? (
          <G>
            <Rect width="320" height="168" fill={url('night')} />
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const inner = 26;
              const outer = i % 2 === 0 ? 74 : 54;
              return (
                <Path
                  key={i}
                  d={`M${160 + Math.cos(angle) * inner} ${84 + Math.sin(angle) * inner} L${160 + Math.cos(angle) * outer} ${84 + Math.sin(angle) * outer}`}
                  stroke="#C8F03C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity={i % 2 === 0 ? 0.9 : 0.5}
                />
              );
            })}
            <Circle cx="160" cy="84" r="20" fill={url('orb')} />
            <Circle cx="70" cy="40" r="7" fill={url('orb')} />
            <Circle cx="258" cy="122" r="10" fill={url('orb')} />
            <Circle cx="248" cy="34" r="4" fill={url('orb')} />
          </G>
        ) : null}

        {variant === 'rings' ? (
          <G>
            <Rect width="320" height="168" fill={url('dusk')} />
            {/* Ringe wie gestapelte Tage, perspektivisch geneigt */}
            {[0, 1, 2, 3, 4].map((i) => (
              <Ellipse
                key={i}
                cx="160"
                cy={128 - i * 18}
                rx={110 - i * 16}
                ry={22 - i * 3}
                stroke={url('arc')}
                strokeWidth="6"
                fill="none"
                opacity={0.35 + i * 0.15}
              />
            ))}
            <Circle cx="160" cy="44" r="16" fill={url('orb')} />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
