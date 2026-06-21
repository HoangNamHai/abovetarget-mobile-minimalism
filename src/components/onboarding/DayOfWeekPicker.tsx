import React from 'react';
import { View } from 'react-native';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { WEEKDAYS } from '../../lib/onboarding/weekly-reminder';

export function DayOfWeekPicker({
  value, onChange,
}: { value: number[]; onChange: (next: number[]) => void }) {
  function toggle(day: number) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      // keep ascending order for stable, predictable output
      onChange([...value, day].sort((a, b) => a - b));
    }
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.value);
        return (
          <PressableFeedback key={d.value} onPress={() => toggle(d.value)}>
            <View
              testID={`day-${d.value}`}
              style={{
                width: 40, height: 40, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? TOKENS.primary : 'transparent',
                borderWidth: 1, borderColor: on ? TOKENS.primary : TOKENS['outline-variant'],
              }}
            >
              <Txt variant="label" style={{ fontSize: 14, fontWeight: '700', color: on ? TOKENS['on-primary'] : TOKENS.outline }}>
                {d.short}
              </Txt>
            </View>
          </PressableFeedback>
        );
      })}
    </View>
  );
}
