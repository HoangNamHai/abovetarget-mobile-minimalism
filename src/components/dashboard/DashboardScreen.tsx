import React from 'react';
import { useBrand } from '../../theme/brand-context';
import { EliteDashboard } from './EliteDashboard';
import { MonographDashboard } from './MonographDashboard';

type Props = {
  onStartStudy: () => void;
  onJoinArena: () => void;
};

export function DashboardScreen({ onStartStudy, onJoinArena }: Props) {
  const { brand } = useBrand();

  if (brand === 'elite') {
    return <EliteDashboard onStartStudy={onStartStudy} onJoinArena={onJoinArena} />;
  }

  return <MonographDashboard onStartStudy={onStartStudy} onJoinArena={onJoinArena} />;
}
