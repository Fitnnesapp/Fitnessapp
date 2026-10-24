import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type HeroRingsProps = {
  /** Farbe, aus der die Ringe aufgehellt werden (meist die Textfarbe auf dem Akzent) */
  color: string;
};

/** Dekoration für die Akzentkarte: übereinanderliegende Ringe wie bei einem Fortschrittsring, angeschnitten. */
export function HeroRings({ color }: HeroRingsProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Defs>
          <LinearGradient id={`fade${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Circle cx="120" cy="60" r="70" stroke={`url(#fade${uid})`} strokeWidth="18" fill="none" />
        <Circle cx="120" cy="60" r="44" stroke={`url(#fade${uid})`} strokeWidth="14" fill="none" />
        <Circle cx="120" cy="60" r="22" stroke={`url(#fade${uid})`} strokeWidth="10" fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: -30, right: -50 },
});
