import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, UIManager, View } from 'react-native';
import type { DiagramInfo, ReasonScreen as ReasonScreenType, ReasonTab } from '../../../types/lesson';
import { useLesson } from '../../../contexts/lesson-context';
import { getLessonImage, hasLessonImage } from '../../../data/lesson-images';
import { TOKENS, RADIUS } from '../../../theme/tokens';
import { Txt } from '../../primitives/Txt';
import { RichText } from '../../primitives/RichText';
import { Appear } from '../../primitives/Appear';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';
import { PressableFeedback } from '../../primitives/PressableFeedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  screen: ReasonScreenType;
};

// A microTeach / tab illustration. Renders nothing if the image isn't bundled.
function Diagram({ diagram }: { diagram: DiagramInfo }) {
  if (!hasLessonImage(diagram.image)) return null;
  return (
    <View>
      <Image
        source={getLessonImage(diagram.image)}
        style={{
          width: '100%',
          aspectRatio: 4 / 3,
          borderRadius: RADIUS.media,
          backgroundColor: TOKENS['surface-container'],
        }}
        contentFit="contain"
        transition={200}
        accessibilityLabel={diagram.alt}
      />
      {diagram.caption ? (
        <Txt
          variant="label"
          style={{ fontSize: 12, color: TOKENS.outline, marginTop: 6, textAlign: 'center' }}
        >
          {diagram.caption}
        </Txt>
      ) : null}
    </View>
  );
}

// One collapsible concept (accordion item): header (title + subtitle + chevron),
// and on expand its optional diagram + markdown content.
function TabItem({
  tab,
  expanded,
  onToggle,
}: {
  tab: ReasonTab;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View>
      <PressableFeedback onPress={onToggle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt
              variant="label"
              style={{ fontSize: 16, color: TOKENS['on-background'], fontFamily: 'Hanken Grotesk Bold' }}
            >
              {tab.title}
            </Txt>
            {tab.subtitle ? (
              <Txt variant="body" style={{ fontSize: 13, color: TOKENS.outline, marginTop: 2 }}>
                {tab.subtitle}
              </Txt>
            ) : null}
          </View>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={TOKENS.outline}
          />
        </View>
      </PressableFeedback>
      {expanded ? (
        <View style={{ paddingBottom: 16, gap: 12 }}>
          {tab.diagram ? <Diagram diagram={tab.diagram} /> : null}
          <RichText className="text-on-surface text-lg leading-relaxed">{tab.content}</RichText>
        </View>
      ) : null}
      <Hairline />
    </View>
  );
}

export function ReasonScreen({ screen }: Props) {
  const { nextScreen } = useLesson();
  const { microTeach } = screen;
  // Accordion: the first concept is open by default (matches the reference app).
  const [expandedId, setExpandedId] = useState<string | null>(microTeach.tabs[0]?.id ?? null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <Appear index={0}>
        <Txt variant="display" className="text-3xl text-on-surface mb-4" style={{ lineHeight: 42 }}>
          {microTeach.title}
        </Txt>
        <Hairline />
      </Appear>

      {microTeach.diagram ? (
        <Appear index={1}>
          <View style={{ marginTop: 16 }}>
            <Diagram diagram={microTeach.diagram} />
          </View>
        </Appear>
      ) : null}

      <Appear index={2}>
        <View style={{ marginTop: 8 }}>
          {microTeach.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              expanded={expandedId === tab.id}
              onToggle={() => toggle(tab.id)}
            />
          ))}
        </View>
      </Appear>

      <Appear index={3}>
        <View style={{ marginTop: 16 }}>
          <Button label="Continue" onPress={nextScreen} />
        </View>
      </Appear>
    </ScrollView>
  );
}
