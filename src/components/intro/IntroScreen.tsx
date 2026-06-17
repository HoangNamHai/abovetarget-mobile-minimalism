import React from 'react';
import { useBrand } from '../../theme/brand-context';
import { EliteIntro } from './EliteIntro';
import { MonographIntro } from './MonographIntro';

type Props = {
  onContinue: () => void;
};

export function IntroScreen({ onContinue }: Props) {
  const { brand } = useBrand();
  if (brand === 'elite') {
    return <EliteIntro onContinue={onContinue} />;
  }
  return <MonographIntro onContinue={onContinue} />;
}
