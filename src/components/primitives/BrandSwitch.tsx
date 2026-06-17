import * as Haptics from 'expo-haptics';
import React from 'react';
import { useBrand } from '../../theme/brand-context';
import { PressableFeedback } from './PressableFeedback';
import { Txt } from './Txt';

export function BrandSwitch() {
  const { brand, toggleBrand } = useBrand();
  const other = brand === 'monograph' ? 'ELITE' : 'MONOGRAPH';

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBrand();
  }

  return (
    <PressableFeedback onPress={handlePress}>
      <Txt
        variant="label"
        className="border border-primary text-primary uppercase tracking-widest px-4 py-1 rounded-full"
      >
        {`Switch to ${other}`}
      </Txt>
    </PressableFeedback>
  );
}
