import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { ACCENTS } from '../../theme/accents';
import { getLessonThumbnail } from '../../data/lesson-images';
import { lessonsIndex } from '../../data/lessons-data';
import { DOMAIN_OF, DOMAIN_TITLE } from '../../data/domains';
import type { Domain } from '../../types/progress';
import type { Lesson } from '../../types/lesson';

const DOMAINS: Domain[] = ['people', 'process', 'business'];

export function lessonsForDomain(domain: Domain, limit = 3): Lesson[] {
  const out: Lesson[] = [];
  for (const module of lessonsIndex) {
    for (const lesson of module.lessons) {
      if (DOMAIN_OF[lesson.domain] === domain) out.push(lesson);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function DomainPicker({
  recommended, selected, onSelect,
}: { recommended: Domain; selected: Domain | null; onSelect: (d: Domain) => void }) {
  // Recommended domain first, the rest in their natural order.
  const ordered: Domain[] = [recommended, ...DOMAINS.filter((d) => d !== recommended)];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
      {ordered.map((domain) => {
        const isSelected = selected === domain;
        const isRecommended = recommended === domain;
        const lesson = lessonsForDomain(domain, 1)[0];
        return (
          <PressableFeedback key={domain} onPress={() => onSelect(domain)}>
            <View
              testID={`domain-card-${domain}`}
              style={{
                height: 240,
                borderRadius: RADIUS.media,
                overflow: 'hidden',
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected ? ACCENTS.selection : TOKENS['outline-variant'],
                backgroundColor: TOKENS['surface-container'],
              }}
            >
              {lesson && (
                <Image
                  source={getLessonThumbnail(lesson.thumbnail)}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              )}
              {/* Scrim so the white title stays readable — confined to the bottom
                  band so the illustration above stays bright. */}
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {isSelected ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENTS.selection, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt variant="label" style={{ fontSize: 13, fontWeight: '700', color: TOKENS['on-primary'] }}>✓</Txt>
                    </View>
                  ) : (
                    <View />
                  )}
                  {isRecommended && (
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: RADIUS.pill,
                        backgroundColor: ACCENTS.premium,
                        shadowColor: '#000',
                        shadowOpacity: 0.35,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 5,
                      }}
                    >
                      <Txt variant="label" style={{ fontSize: 11, fontWeight: '800', color: '#1a1206', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Recommended for you
                      </Txt>
                    </View>
                  )}
                </View>
                <Txt variant="display" style={{ fontSize: 22, color: '#ffffff', letterSpacing: -0.3 }}>
                  {DOMAIN_TITLE[domain]}
                </Txt>
              </View>
            </View>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
