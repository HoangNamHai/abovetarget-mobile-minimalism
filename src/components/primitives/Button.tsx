import React from 'react';
import { useHaptics } from '../../hooks/use-haptics';
import { PressableFeedback } from './PressableFeedback';
import { Txt } from './Txt';

type ButtonVariant = 'primary' | 'secondary';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
};

export function Button({ label, onPress, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  const { impact } = useHaptics();

  function handlePress() {
    impact();
    onPress();
  }

  return (
    <PressableFeedback
      onPress={handlePress}
      className={
        isPrimary
          ? 'bg-primary px-6 py-3 rounded-full items-center'
          : 'bg-on-primary border border-primary px-6 py-3 rounded-full items-center'
      }
    >
      <Txt
        variant="label"
        className={isPrimary ? 'text-on-primary uppercase tracking-widest' : 'text-primary uppercase tracking-widest'}
      >
        {label}
      </Txt>
    </PressableFeedback>
  );
}
