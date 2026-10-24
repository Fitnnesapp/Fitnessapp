import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

type KettlebellHeroProps = {
  size?: number;
};

/**
 * Räumlich wirkende Kettlebell als Markenbild für Einstieg und Erfolge.
 * Tiefe entsteht aus Licht von links oben: radialer Verlauf, Glanzpunkt, weicher Bodenschatten.
 * Bewusst feste Markenfarben, damit sie in Hell und Dunkel gleich kräftig wirkt.
 */
export function KettlebellHero({ size = 220 }: KettlebellHeroProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}${uid}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityRole="image" accessibilityLabel="Kettlebell">
      <Defs>
        <RadialGradient id={id('glow')} cx="50%" cy="55%" r="50%">
          <Stop offset="0" stopColor="#C8F03C" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#C8F03C" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={id('body')} cx="36%" cy="34%" r="70%">
          <Stop offset="0" stopColor="#F4FFC2" />
          <Stop offset="0.35" stopColor="#D6F55A" />
          <Stop offset="0.75" stopColor="#9CC21F" />
          <Stop offset="1" stopColor="#5C7A0B" />
        </RadialGradient>
        <LinearGradient id={id('handle')} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EAFF9A" />
          <Stop offset="0.45" stopColor="#9CC21F" />
          <Stop offset="1" stopColor="#3F5608" />
        </LinearGradient>
        <RadialGradient id={id('shadow')} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.38" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={id('orb')} cx="35%" cy="30%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.4" stopColor="#D6F55A" />
          <Stop offset="1" stopColor="#6E8F0F" />
        </RadialGradient>
      </Defs>

      <Circle cx="100" cy="112" r="96" fill={`url(#${id('glow')})`} />
      <Ellipse cx="100" cy="190" rx="56" ry="8" fill={`url(#${id('shadow')})`} />

      {/* Griff: hoch über der Kugel, damit die Öffnung sichtbar bleibt; Lichtkante für die Rundung */}
      <Path d="M64 120 C 54 6, 146 6, 136 120" stroke={`url(#${id('handle')})`} strokeWidth="17" fill="none" strokeLinecap="round" />
      <Path d="M70 100 C 64 30, 112 18, 128 40" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Kugel mit Standfläche */}
      <Path d="M72 176 L128 176 L122 186 L78 186 Z" fill="#4E690A" />
      <Circle cx="100" cy="132" r="52" fill={`url(#${id('body')})`} />
      <Ellipse cx="81" cy="112" rx="15" ry="8" fill="#FFFFFF" opacity="0.55" transform="rotate(-32 81 112)" />
      <Ellipse cx="126" cy="158" rx="20" ry="9" fill="#3B5207" opacity="0.18" transform="rotate(-28 126 158)" />

      {/* Schwebende Kugeln für Bewegung und Tiefe */}
      <G>
        <Circle cx="34" cy="64" r="9" fill={`url(#${id('orb')})`} />
        <Circle cx="168" cy="48" r="6" fill={`url(#${id('orb')})`} />
        <Circle cx="174" cy="132" r="11" fill={`url(#${id('orb')})`} />
        <Circle cx="22" cy="140" r="4" fill={`url(#${id('orb')})`} opacity="0.8" />
      </G>
    </Svg>
  );
}
