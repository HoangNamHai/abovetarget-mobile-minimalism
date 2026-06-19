import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Brand } from '../../theme/brand-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Icon } from '../primitives/Icon';
import { Txt } from '../primitives/Txt';

// ─── Presentational bodies ───────────────────────────────────────────────────

export type FeedbackBodyProps = {
  explanation: string;
  onDismiss: () => void;
  brand: Brand;
};

export function CorrectBody({ explanation, onDismiss, brand }: FeedbackBodyProps) {
  const isElite = brand === 'elite';
  return (
    <View style={[styles.body, { backgroundColor: TOKENS['surface-container-lowest'] }]}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Icon symbol="check_circle" size={20} color={TOKENS.primary} />
        <Txt
          variant="label"
          style={[styles.label, { color: TOKENS['on-background'] }]}
        >
          CORRECT RESPONSE
        </Txt>
      </View>

      {/* Display headline */}
      <Txt
        variant="display"
        style={[
          styles.headline,
          { color: TOKENS['on-background'] },
          isElite && styles.headlineElite,
        ]}
      >
        EXCELLENT WORK.
      </Txt>

      <Hairline />

      {/* Explanation */}
      <Txt
        variant="body"
        style={[styles.explanation, { color: TOKENS['on-background'] }]}
      >
        {explanation}
      </Txt>

      {/* Action */}
      <View style={styles.footer}>
        <Button label="CONTINUE" onPress={onDismiss} />
      </View>
    </View>
  );
}

export function IncorrectBody({ explanation, onDismiss, brand }: FeedbackBodyProps) {
  const isElite = brand === 'elite';
  return (
    <View style={[styles.body, { backgroundColor: '#DC2626' }]}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Icon symbol="cancel" size={20} color="#ffffff" />
        <Txt
          variant="label"
          style={[styles.label, { color: '#ffffff' }]}
        >
          INCORRECT CHOICE
        </Txt>
      </View>

      {/* Display headline */}
      <Txt
        variant="display"
        style={[
          styles.headline,
          { color: '#ffffff' },
          isElite && styles.headlineElite,
        ]}
      >
        NOT QUITE.
      </Txt>

      <View style={styles.whiteDivider} />

      {/* Explanation */}
      <Txt
        variant="body"
        style={[styles.explanation, { color: 'rgba(255,255,255,0.9)' }]}
      >
        {explanation}
      </Txt>

      {/* Action */}
      <View style={styles.footer}>
        <Button label="TRY AGAIN" onPress={onDismiss} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 48,
    lineHeight: 52,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  headlineElite: {
    letterSpacing: -1,
  },
  whiteDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto',
  },
});
