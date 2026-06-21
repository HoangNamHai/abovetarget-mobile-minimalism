import React from 'react';
import { View } from 'react-native';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { DOMAIN_TITLE } from '../../data/domains';
import type { Domain } from '../../types/progress';

type Conf = { people: number; process: number; business: number };
const ROWS: Domain[] = ['people', 'process', 'business'];

export function ConfidenceRating({ value, onChange }: { value: Conf; onChange: (d: Domain, v: number) => void }) {
  return (
    <View style={{ gap: 24 }}>
      {ROWS.map((domain) => (
        <View key={domain} style={{ gap: 8 }}>
          <Txt variant="body" style={{ fontSize: 15, fontWeight: '700', color: TOKENS.primary }}>
            {DOMAIN_TITLE[domain]}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = value[domain] === n;
              return (
                <PressableFeedback key={n} onPress={() => onChange(domain, n)}>
                  <View
                    testID={`confidence-${domain}-${n}`}
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selected ? TOKENS.primary : TOKENS['surface-container-lowest'],
                      borderWidth: 1, borderColor: selected ? TOKENS.primary : TOKENS['outline-variant'],
                    }}
                  >
                    <Txt variant="label" style={{ fontSize: 14, color: selected ? TOKENS['on-primary'] : TOKENS.outline }}>
                      {n}
                    </Txt>
                  </View>
                </PressableFeedback>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
