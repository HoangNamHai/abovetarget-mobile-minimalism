import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, View } from 'react-native';
import { getLessonImage, hasLessonImage } from '../../data/lesson-images';
import { TOKENS } from '../../theme/tokens';
import { RichText } from '../primitives/RichText';
import { Txt } from '../primitives/Txt';
import type { FailureCard } from '../../types/lesson';

type Props = {
  cards: FailureCard[];
  showIndicators?: boolean;
};

// Swipeable gallery of "failure" comic cards shown on the Hook screen. Supports
// paging by swipe and by the prev/next buttons, with dot indicators.
export function FailureCarousel({ cards, showIndicators = true }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(cards.length - 1, i));
    setIndex(clamped);
    if (width) scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  if (cards.length === 0) return null;

  const atStart = index === 0;
  const atEnd = index === cards.length - 1;

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          scrollEventThrottle={16}
        >
          {cards.map((card) => (
            <View key={card.id} style={{ width }}>
              <FailureCardView card={card} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Navigation: prev · dots · next */}
      {cards.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <NavButton icon="chevron-left" disabled={atStart} onPress={() => goTo(index - 1)} />

          {showIndicators && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {cards.map((card, i) => (
                <Pressable
                  key={card.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to card ${i + 1}`}
                  onPress={() => goTo(i)}
                  hitSlop={8}
                >
                  <View
                    style={{
                      width: i === index ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === index ? TOKENS.primary : TOKENS['outline-variant'],
                    }}
                  />
                </Pressable>
              ))}
            </View>
          )}

          <NavButton icon="chevron-right" disabled={atEnd} onPress={() => goTo(index + 1)} />
        </View>
      )}
    </View>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'chevron-left' | 'chevron-right';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'chevron-left' ? 'Previous card' : 'Next card'}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? TOKENS['surface-container'] : TOKENS.primary,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <MaterialIcons name={icon} size={24} color={disabled ? TOKENS.outline : TOKENS['on-primary']} />
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function FailureCardView({ card }: { card: FailureCard }) {
  const hasImage = card.image && hasLessonImage(card.image);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: TOKENS['outline-variant'],
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: TOKENS['surface-container-lowest'],
      }}
    >
      {hasImage && (
        <Image
          source={getLessonImage(card.image)}
          style={{ width: '100%', aspectRatio: 1, backgroundColor: TOKENS['surface-container'] }}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={{ padding: 16, gap: 6 }}>
        <Txt variant="label" style={{ fontSize: 18, color: TOKENS['on-background'] }}>
          {card.icon ? `${card.icon}  ` : ''}
          {card.title}
        </Txt>
        {card.summary ? (
          <Txt variant="label" style={{ color: TOKENS.outline, textTransform: 'uppercase', letterSpacing: 1 }}>
            {card.summary}
          </Txt>
        ) : null}
        {card.details ? (
          <RichText className="text-on-surface text-base leading-relaxed">{card.details}</RichText>
        ) : null}
      </View>
    </View>
  );
}
