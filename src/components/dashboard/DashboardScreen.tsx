import React from 'react';
import { useBrand } from '../../theme/brand-context';
import type { Domain } from '../../types/progress';
import { EliteDashboard } from './EliteDashboard';
import { MonographDashboard } from './MonographDashboard';

type Props = {
  onStartStudy: () => void;
  onOpenLesson?: (lessonId: string) => void;
  onOpenDomain?: (domain: Domain) => void;
  /** Open the paywall; powers the free-tier upgrade CTA. */
  onUpgrade?: () => void;
};

export function DashboardScreen({ onStartStudy, onOpenLesson, onOpenDomain, onUpgrade }: Props) {
  const { brand } = useBrand();

  if (brand === 'elite') {
    return (
      <EliteDashboard onStartStudy={onStartStudy} onOpenLesson={onOpenLesson} onOpenDomain={onOpenDomain} />
    );
  }

  return (
    <MonographDashboard
      onStartStudy={onStartStudy}
      onOpenLesson={onOpenLesson}
      onOpenDomain={onOpenDomain}
      onUpgrade={onUpgrade}
    />
  );
}
