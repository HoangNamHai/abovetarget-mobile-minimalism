import React from 'react';
import { View } from 'react-native';
import { TOKENS } from '../../theme/tokens';

export function OnboardingProgress({ progress }: { progress: number }) {
  return (
    <View style={{ height: 3, backgroundColor: TOKENS['surface-container-high'], borderRadius: 2 }}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
          height: 3,
          backgroundColor: TOKENS.primary,
          borderRadius: 2,
        }}
      />
    </View>
  );
}
