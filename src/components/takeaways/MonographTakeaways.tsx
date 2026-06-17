import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { View } from 'react-native';
import { MONOGRAPH_TAKEAWAYS, MonographTakeaway } from '../../data/takeaways';
import { TOKENS } from '../../theme/tokens';
import { Icon } from '../primitives/Icon';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';

type Props = {
  onQuickJump?: (t: string) => void;
  activeJump?: string;
};

function TakeawayCard({ item }: { item: MonographTakeaway }) {
  return (
    <View
      style={{
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: TOKENS['outline-variant'],
        borderRightWidth: 1,
        borderRightColor: TOKENS['outline-variant'],
        backgroundColor: TOKENS['surface-container-lowest'],
      }}
    >
      <View style={{ marginBottom: 12 }}>
        <Icon symbol={item.icon} size={30} color={TOKENS.outline} />
      </View>
      <Txt
        variant="body"
        style={{
          fontSize: 16,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: -0.3,
          color: TOKENS['on-background'],
          marginBottom: 10,
        }}
      >
        {item.title}
      </Txt>
      <Txt
        variant="body"
        style={{
          fontSize: 13,
          lineHeight: 20,
          color: TOKENS.outline,
        }}
      >
        {item.description}
      </Txt>
    </View>
  );
}

export function MonographTakeaways({ onQuickJump, activeJump }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: TOKENS.background }}>
      {/* Hero Title Section */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 48,
          borderBottomWidth: 1,
          borderBottomColor: TOKENS['outline-variant'],
        }}
      >
        <Txt
          variant="label"
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: TOKENS.outline,
            marginBottom: 4,
          }}
        >
          MODULE 01 / PRINCIPLES
        </Txt>
        <Txt
          variant="display"
          style={{
            fontSize: 52,
            lineHeight: 48,
            letterSpacing: -2,
            color: TOKENS['on-background'],
          }}
        >
          KEY TAKEAWAYS
        </Txt>
      </View>

      {/* Theory Cards Grid */}
      <View
        style={{
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: TOKENS['outline-variant'],
          marginHorizontal: 20,
        }}
      >
        <FlashList
          data={MONOGRAPH_TAKEAWAYS}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => <TakeawayCard item={item} />}
          scrollEnabled={false}
        />
      </View>

      {/* Quick Jump */}
      {onQuickJump && (
        <View
          style={{
            backgroundColor: '#000000',
            paddingVertical: 48,
            paddingHorizontal: 20,
            marginTop: 32,
          }}
        >
          <Txt
            variant="display"
            style={{ fontSize: 20, color: '#ffffff', marginBottom: 16, letterSpacing: -0.5 }}
          >
            QUICK JUMP
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['CHALLENGE', 'THEORY', 'TRANSFER', 'PRACTICE'].map((tab) => (
              <PressableFeedback key={tab} onPress={() => onQuickJump(tab)}>
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: activeJump === tab ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    backgroundColor: activeJump === tab ? '#ffffff' : 'transparent',
                    borderRadius: 6,
                  }}
                >
                  <Txt
                    variant="label"
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      color: activeJump === tab ? '#000000' : '#ffffff',
                    }}
                  >
                    {tab}
                  </Txt>
                </View>
              </PressableFeedback>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
