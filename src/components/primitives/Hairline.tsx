import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TOKENS } from '../../theme/tokens';

export function Hairline() {
  return (
    <View
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: TOKENS['outline-variant'] }}
    />
  );
}
