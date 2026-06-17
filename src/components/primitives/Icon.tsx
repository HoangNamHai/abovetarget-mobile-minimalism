import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TOKENS } from '../../theme/tokens';
import { iconFor } from './icon-map';

type Props = {
  symbol: string;
  size?: number;
  color?: string;
};

export function Icon({ symbol, size = 24, color = TOKENS['on-background'] }: Props) {
  const { name } = iconFor(symbol);
  return <MaterialIcons name={name as any} size={size} color={color} />;
}
