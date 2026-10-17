import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { authErrorMessage } from '@/lib/logic/auth-errors';
import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '@/lib/supabase/auth';

type SocialSignInProps = {
  disabled?: boolean;
  onError: (message: string) => void;
};

export function SocialSignIn({ disabled, onError }: SocialSignInProps) {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  async function run(provider: 'google' | 'apple', action: () => Promise<void>) {
    setBusy(provider);
    try {
      await action();
    } catch (e) {
      onError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color="textSecondary">
          oder
        </AppText>
        <View style={styles.line} />
      </View>
      {appleAvailable ? (
        <Button
          title="Mit Apple fortfahren"
          variant="secondary"
          loading={busy === 'apple'}
          disabled={disabled || busy !== null}
          onPress={() => run('apple', signInWithApple)}
        />
      ) : null}
      <Button
        title="Mit Google fortfahren"
        variant="secondary"
        loading={busy === 'google'}
        disabled={disabled || busy !== null}
        onPress={() => run('google', signInWithGoogle)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.three },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#8885' },
});
