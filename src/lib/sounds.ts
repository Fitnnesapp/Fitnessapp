import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useMemo } from 'react';

function play(player: AudioPlayer) {
  try {
    void player.seekTo(0);
    player.play();
  } catch {
    // Ein fehlender Ton darf das Training nie unterbrechen
  }
}

/** Signaltöne für den Workout-Player: kurzer Ton beim Countdown, langer Ton beim Wechsel. */
export function useCountdownSounds() {
  const shortPlayer = useAudioPlayer(require('@/assets/sounds/beep-short.wav'));
  const longPlayer = useAudioPlayer(require('@/assets/sounds/beep-long.wav'));

  useEffect(() => {
    // Töne auch im Stummschalter-Modus und bei gesperrtem Bildschirm abspielen, andere Musik nur leiser stellen
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, []);

  return useMemo(
    () => ({ tick: () => play(shortPlayer), go: () => play(longPlayer) }),
    [shortPlayer, longPlayer],
  );
}
