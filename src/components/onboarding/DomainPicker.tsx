import React from 'react';
import { View, ScrollView } from 'react-native';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { ACCENTS } from '../../theme/accents';
import { OnboardingLessonCard } from './OnboardingLessonCard';
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
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
      {DOMAINS.map((domain) => {
        const isSelected = selected === domain;
        const isRecommended = recommended === domain;
        return (
          <PressableFeedback key={domain} onPress={() => onSelect(domain)}>
            <View
              testID={`domain-card-${domain}`}
              style={{
                borderRadius: RADIUS.media, padding: 12, gap: 10,
                borderWidth: 2, borderColor: isSelected ? TOKENS.primary : TOKENS['outline-variant'],
                backgroundColor: isSelected ? TOKENS['surface-container-high'] : TOKENS['surface-container-lowest'],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt variant="body" style={{ fontSize: 17, fontWeight: '700', color: TOKENS.primary }}>
                  {DOMAIN_TITLE[domain]}
                </Txt>
                {isRecommended && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: ACCENTS.selection }}>
                    <Txt variant="label" style={{ fontSize: 10, fontWeight: '700', color: TOKENS['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Recommended for you
                    </Txt>
                  </View>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {lessonsForDomain(domain, 3).map((lesson) => (
                  <OnboardingLessonCard key={lesson.id} lesson={lesson} />
                ))}
              </ScrollView>
            </View>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
