import React from 'react';
import { View, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { indexFromOffset } from '../../lib/onboarding/time-wheel';

export const ITEM_HEIGHT = 44;
const VISIBLE = 5; // odd, so one row sits dead-center

type Props = {
  items: string[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  testID?: string;
  width?: number;
};

export function WheelColumn({ items, initialIndex, onIndexChange, testID, width = 64 }: Props) {
  function settle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    onIndexChange(indexFromOffset(y, ITEM_HEIGHT, items.length));
  }
  const pad = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE, width }}>
      <ScrollView
        testID={testID}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: pad }}
      >
        {items.map((label, idx) => (
          <View key={idx} style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="display" style={{ fontSize: 24, color: TOKENS.primary }}>
              {label}
            </Txt>
          </View>
        ))}
      </ScrollView>
      {/* Center selection band */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: 0, right: 0, top: pad, height: ITEM_HEIGHT,
          borderTopWidth: 1, borderBottomWidth: 1, borderColor: TOKENS['outline-variant'],
        }}
      />
    </View>
  );
}
