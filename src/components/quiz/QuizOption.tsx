import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Brand } from '../../theme/brand-context';
import { cardVariants } from '../../theme/variants';
import { TOKENS } from '../../theme/tokens';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { ACCENTS } from '../../theme/accents';

// Accent used to highlight the chosen (not-yet-checked) answer.
const SELECTED_BLUE = ACCENTS.selection;

type Option = {
  key: string;
  label: string;
  icon?: string;
};

type Props = {
  option: Option;
  selected: boolean;
  brand: Brand;
  onPress: () => void;
  /** A previously-chosen wrong answer: rendered greyed-out, struck-through, inert. */
  disabled?: boolean;
};

export function QuizOption({ option, selected, brand, onPress, disabled = false }: Props) {
  const isElite = brand === 'elite';

  const baseClassName = cardVariants({ brand });
  const containerStyle = [
    styles.base,
    // `disabled` (a locked wrong answer) wins over the selected fill.
    disabled ? styles.disabled : selected ? styles.selected : styles.unselected,
  ];

  const labelColor = disabled
    ? TOKENS.outline
    : selected
      ? TOKENS['on-primary']
      : TOKENS['on-background'];
  const keyColor = disabled
    ? TOKENS.outline
    : selected
      ? 'rgba(255,255,255,0.6)'
      : TOKENS.outline;

  return (
    <PressableFeedback onPress={onPress} disabled={disabled}>
      <View className={baseClassName} style={containerStyle}>
        <View style={styles.row}>
          {isElite && (
            <Txt variant="label" style={[styles.optionKey, { color: keyColor }]}>
              {option.key}.
            </Txt>
          )}
          <Txt
            variant="body"
            style={[
              styles.label,
              { color: labelColor },
              disabled && { textDecorationLine: 'line-through' },
            ]}
          >
            {option.label}
          </Txt>
        </View>
      </View>
    </PressableFeedback>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 8,
  },
  selected: {
    backgroundColor: SELECTED_BLUE,
    borderColor: SELECTED_BLUE,
  },
  unselected: {},
  disabled: {
    backgroundColor: TOKENS['surface-container'],
    borderColor: TOKENS['outline-variant'],
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionKey: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    minWidth: 20,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});
