import React from 'react';
import { Text, TextProps } from 'react-native';

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

export function Txt({ variant = 'body', className, style, children, ...rest }: Props) {
  return (
    <Text
      className={className}
      style={[VARIANT_STYLE[variant], style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
