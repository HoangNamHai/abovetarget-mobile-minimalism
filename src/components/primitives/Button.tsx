import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useHaptics } from '../../hooks/use-haptics';
import { TOKENS } from '../../theme/tokens';
import { PressableFeedback } from './PressableFeedback';
import { Txt } from './Txt';

type ButtonVariant = 'primary' | 'secondary';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Blocks presses and dims the button. */
  disabled?: boolean;
  /** Blocks presses and shows a spinner in place of the label. */
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: Props) {
  const isPrimary = variant === 'primary';
  const { impact } = useHaptics();
  const inert = disabled || loading;

  function handlePress() {
    if (inert) return;
    impact();
    onPress();
  }

  const base = isPrimary
    ? 'bg-primary px-6 py-3 rounded-full items-center'
    : 'bg-on-primary border border-primary px-6 py-3 rounded-full items-center';

  return (
    <PressableFeedback
      onPress={handlePress}
      disabled={inert}
      className={inert ? `${base} opacity-50` : base}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? TOKENS['on-primary'] : TOKENS.primary} />
      ) : (
        <Txt
          variant="label"
          className={isPrimary ? 'text-on-primary uppercase tracking-widest' : 'text-primary uppercase tracking-widest'}
        >
          {label}
        </Txt>
      )}
    </PressableFeedback>
  );
}
