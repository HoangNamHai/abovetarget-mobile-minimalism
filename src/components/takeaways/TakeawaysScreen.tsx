import React from 'react';
import { useBrand } from '../../theme/brand-context';
import { EliteTakeaways } from './EliteTakeaways';
import { MonographTakeaways } from './MonographTakeaways';

type Props = {
  onQuickJump?: (t: string) => void;
  activeJump?: string;
};

export function TakeawaysScreen({ onQuickJump, activeJump }: Props) {
  const { brand } = useBrand();
  if (brand === 'elite') {
    return <EliteTakeaways onQuickJump={onQuickJump} activeJump={activeJump} />;
  }
  return <MonographTakeaways onQuickJump={onQuickJump} activeJump={activeJump} />;
}
