import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { WHY_MAX_LENGTH, WHY_SUGGESTIONS } from '@/lib/logic/why';
import { useSettings } from '@/lib/storage/settings-store';

/** Eigenes Warum festhalten, mit Vorschlägen als Anstoß. Gespeichert beim Verlassen des Felds. */
export function WhyEditor() {
  const why = useSettings((state) => state.why);
  const setWhy = useSettings((state) => state.setWhy);
  const [text, setText] = useState(why);

  return (
    <View style={styles.field}>
      <TextField
        label="Dein Warum"
        value={text}
        onChangeText={setText}
        onBlur={() => setWhy(text)}
        onSubmitEditing={() => setWhy(text)}
        placeholder="Wofür trainierst du? In deinen Worten."
        maxLength={WHY_MAX_LENGTH}
      />
      {!text ? (
        <View style={styles.chips}>
          {WHY_SUGGESTIONS.slice(0, 4).map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              selected={false}
              onPress={() => {
                setText(suggestion);
                setWhy(suggestion);
              }}
            />
          ))}
        </View>
      ) : null}
      <AppText variant="caption" color="textSecondary">
        Erscheint auf dem Start-Bildschirm, wenn du ein paar Tage pausiert hast, und zum Wochenstart.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
