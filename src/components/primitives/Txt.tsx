import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

type TxtVariant = 'display' | 'body' | 'label';

type Props = TextProps & {
  variant?: TxtVariant;
  className?: string;
  children?: React.ReactNode;
};

const VARIANT_STYLE: Record<TxtVariant, object> = {
  display: { fontFamily: 'Anton', letterSpacing: -0.5 },
  body: { fontFamily: 'Hanken Grotesk' },
  label: { fontFamily: 'Hanken Grotesk' },
};

// Anton is a tall condensed face: its caps overflow a tight line box and get
// clipped at the top whenever lineHeight sits close to (or equal to) fontSize.
// Enforce a minimum lineHeight so display glyphs always have vertical headroom.
// Applied only when an inline numeric fontSize is present — className-sized
// display text passes an explicit lineHeight at the call site instead.
const DISPLAY_LINE_HEIGHT_RATIO = 1.35;

function withDisplayHeadroom(style: TextProps['style']): TextProps['style'] {
  const flat = StyleSheet.flatten(style) || {};
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : undefined;
  if (fontSize == null) return style;
  const minLineHeight = Math.round(fontSize * DISPLAY_LINE_HEIGHT_RATIO);
  const current = typeof flat.lineHeight === 'number' ? flat.lineHeight : 0;
  if (current >= minLineHeight) return style;
  return [style, { lineHeight: minLineHeight }];
}

export function Txt({ variant = 'body', className, style, children, ...rest }: Props) {
  const resolvedStyle = variant === 'display' ? withDisplayHeadroom(style) : style;
  return (
    <Text
      className={className}
      style={[VARIANT_STYLE[variant], resolvedStyle]}
      {...rest}
    >
      {children}
    </Text>
  );
}
