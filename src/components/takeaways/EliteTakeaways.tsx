import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { Grayscale } from 'react-native-color-matrix-image-filters';
import { ELITE_TAKEAWAYS, EliteTakeaway } from '../../data/takeaways';
import { TOKENS } from '../../theme/tokens';
import { Icon } from '../primitives/Icon';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';

type Props = {
  onQuickJump?: (t: string) => void;
  activeJump?: string;
};

function EliteCell({ item }: { item: EliteTakeaway }) {
  const bg = item.dark ? '#000000' : TOKENS['surface-container-lowest'];
  const textColor = item.dark ? '#ffffff' : TOKENS['on-background'];
  const subColor = item.dark ? 'rgba(255,255,255,0.8)' : TOKENS.outline;
  const borderColor = item.dark ? '#ffffff' : '#000000';

  return (
    <View
      style={{
        backgroundColor: bg,
        padding: 24,
        minHeight: 200,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        justifyContent: 'flex-start',
      }}
    >
      {/* Number badge */}
      <View
        style={{
          borderWidth: 1,
          borderColor: borderColor,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignSelf: 'flex-start',
          marginBottom: 16,
        }}
      >
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 2, color: textColor, fontWeight: '700' }}
        >
          {item.num}
        </Txt>
      </View>

      <Txt
        variant="body"
        style={{
          fontSize: 17,
          fontWeight: '700',
          textTransform: 'uppercase',
          color: textColor,
          marginBottom: 8,
        }}
      >
        {item.title}
      </Txt>

      <Txt
        variant="body"
        style={{ fontSize: 13, lineHeight: 20, color: subColor }}
      >
        {item.description}
      </Txt>

      {/* Image cell — grayscale via react-native-color-matrix-image-filters */}
      {!!item.image && (
        <View
          style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: TOKENS['outline-variant'],
            overflow: 'hidden',
          }}
        >
          <Grayscale>
            <Image
              source={item.image}
              style={{ width: '100%', height: 160 }}
              contentFit="cover"
            />
          </Grayscale>
        </View>
      )}
    </View>
  );
}

const QUICK_JUMP_ITEMS = [
  { id: 'CHALLENGE', icon: 'bolt', label: 'Challenge' },
  { id: 'THEORY', icon: 'import_contacts', label: 'Theory' },
  { id: 'TRANSFER', icon: 'swap_horiz', label: 'Transfer' },
  { id: 'PRACTICE', icon: 'model_training', label: 'Practice' },
];

export function EliteTakeaways({ onQuickJump, activeJump }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: TOKENS.background }}>
      {/* Hero Section */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 32,
          borderBottomWidth: 1,
          borderBottomColor: '#000000',
        }}
      >
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 2, color: TOKENS.outline, marginBottom: 4 }}
        >
          CHAPTER 04 // THEORY
        </Txt>
        <Txt
          variant="display"
          style={{
            fontSize: 40,
            lineHeight: 40,
            letterSpacing: -1,
            color: TOKENS['on-background'],
          }}
        >
          KEY TAKEAWAYS
        </Txt>
      </View>

      {/* Bento Grid */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#000000',
          marginHorizontal: 20,
          marginVertical: 24,
          gap: 1,
          backgroundColor: '#000000',
        }}
      >
        <FlashList
          data={ELITE_TAKEAWAYS}
          keyExtractor={(item) => item.num}
          renderItem={({ item }) => <EliteCell item={item} />}
          scrollEnabled={false}
        />
      </View>

      {/* Quick Jump Grid */}
      {onQuickJump && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Txt
            variant="label"
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: TOKENS.outline,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Navigate Module
          </Txt>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 1,
              borderWidth: 1,
              borderColor: '#000000',
              backgroundColor: '#000000',
            }}
          >
            {QUICK_JUMP_ITEMS.map((nav) => (
              <View key={nav.id} style={{ width: '50%' }}>
                <PressableFeedback
                  onPress={() => onQuickJump(nav.id)}
                >
                <View
                  style={{
                    backgroundColor: activeJump === nav.id ? '#000000' : '#ffffff',
                    paddingVertical: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 100,
                  }}
                >
                  <Icon
                    symbol={nav.icon}
                    size={24}
                    color={activeJump === nav.id ? '#ffffff' : '#000000'}
                  />
                  <Txt
                    variant="label"
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      color: activeJump === nav.id ? '#ffffff' : '#000000',
                      marginTop: 8,
                    }}
                  >
                    {nav.label.toUpperCase()}
                  </Txt>
                </View>
                </PressableFeedback>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
