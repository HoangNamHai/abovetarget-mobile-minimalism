import React, { useState } from 'react';
import { View } from 'react-native';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { WheelColumn } from './WheelColumn';
import { HOURS12, MINUTES, PERIODS, to24h, from24h } from '../../lib/onboarding/time-wheel';

type Props = {
  hour: number; // 0–23
  minute: number; // multiple of 5
  onChange: (next: { hour: number; minute: number }) => void;
};

function nearestMinuteIndex(minute: number): number {
  let best = 0;
  for (let i = 0; i < MINUTES.length; i++) {
    if (Math.abs(MINUTES[i] - minute) < Math.abs(MINUTES[best] - minute)) best = i;
  }
  return best;
}

export function TimeWheel({ hour, minute, onChange }: Props) {
  const init = from24h(hour);
  const [hIdx, setH] = useState(Math.max(0, HOURS12.indexOf(init.hour12)));
  const [mIdx, setM] = useState(nearestMinuteIndex(minute));
  const [pIdx, setP] = useState(Math.max(0, PERIODS.indexOf(init.period)));

  function emit(h: number, m: number, p: number) {
    onChange({ hour: to24h(HOURS12[h], PERIODS[p]), minute: MINUTES[m] });
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <WheelColumn
        testID="wheel-hour"
        items={HOURS12.map(String)}
        initialIndex={hIdx}
        onIndexChange={(i) => { setH(i); emit(i, mIdx, pIdx); }}
      />
      <Txt variant="display" style={{ fontSize: 24, color: TOKENS.primary }}>:</Txt>
      <WheelColumn
        testID="wheel-minute"
        items={MINUTES.map((m) => String(m).padStart(2, '0'))}
        initialIndex={mIdx}
        onIndexChange={(i) => { setM(i); emit(hIdx, i, pIdx); }}
      />
      <WheelColumn
        testID="wheel-period"
        items={[...PERIODS]}
        initialIndex={pIdx}
        onIndexChange={(i) => { setP(i); emit(hIdx, mIdx, i); }}
      />
    </View>
  );
}
