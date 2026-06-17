import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Brand } from '../../theme/brand-context';
import { TOKENS } from '../../theme/tokens';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';

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
};

export function QuizOption({ option, selected, brand, onPress }: Props) {
  const isElite = brand === 'elite';

  const containerStyle = [
    styles.base,
    isElite ? styles.eliteBase : styles.monographBase,
    selected ? styles.selected : styles.unselected,
  ];

  const labelColor = selected ? TOKENS['on-primary'] : TOKENS['on-background'];
  const keyColor = selected ? 'rgba(255,255,255,0.6)' : TOKENS.outline;

  return (
    <PressableFeedback onPress={onPress}>
      <View style={containerStyle}>
        <View style={styles.row}>
          {isElite && (
            <Txt variant="label" style={[styles.optionKey, { color: keyColor }]}>
              {option.key}.
            </Txt>
          )}
          <Txt variant="body" style={[styles.label, { color: labelColor }]}>
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
  monographBase: {
    borderWidth: 1,
    borderColor: TOKENS['outline-variant'],
    borderRadius: 2,
    backgroundColor: TOKENS['surface-container-lowest'],
  },
  eliteBase: {
    borderWidth: 2,
    borderColor: TOKENS['outline-variant'],
    borderRadius: 0,
    backgroundColor: TOKENS['surface-container-lowest'],
  },
  selected: {
    backgroundColor: TOKENS.primary,
    borderColor: TOKENS.primary,
  },
  unselected: {},
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
