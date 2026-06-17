import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Icon } from '../primitives/Icon';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';

type Props = {
  onContinue: () => void;
};

export function MonographIntro({ onContinue }: Props) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f9' }} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={{ width: '100%', height: 500, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: TOKENS['outline-variant'] }}>
        <Image
          source={require('../../../assets/placeholders/hero-monograph.jpg')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.4, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 }}>
          <Txt
            variant="label"
            style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: 4, marginBottom: 8, fontSize: 11 }}
          >
            Foundation Module 01
          </Txt>
          <Txt
            variant="display"
            style={{ color: '#ffffff', fontSize: 44, lineHeight: 46, letterSpacing: -1 }}
          >
            What is Project Management?
          </Txt>
        </View>
      </View>

      {/* Editorial Content: The Story of Alex Mitchell */}
      <View style={{ paddingVertical: 60, paddingHorizontal: 24, backgroundColor: '#ffffff' }}>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          {/* Left column: chapter heading */}
          <View style={{ flex: 4, borderLeftWidth: 2, borderLeftColor: '#000000', paddingLeft: 16 }}>
            <Txt
              variant="display"
              style={{ fontSize: 28, lineHeight: 30, letterSpacing: -0.5, marginBottom: 12 }}
            >
              The Story of Alex Mitchell
            </Txt>
            <Txt
              variant="label"
              style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline }}
            >
              Chapter One: The Architect's Dilemma
            </Txt>
          </View>
        </View>

        {/* Drop-cap paragraph */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Drop cap: large first letter floated left */}
            <Txt
              variant="body"
              style={{
                fontSize: 80,
                lineHeight: 64,
                fontWeight: '800',
                marginRight: 4,
                color: '#000000',
                // Pull the cap up so its top aligns with first text line
                marginTop: -4,
              }}
            >
              A
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt
                variant="body"
                style={{ fontSize: 17, lineHeight: 26, color: '#000000' }}
              >
                lex Mitchell stood in the center of the construction site, looking at the blueprint that seemed more like a labyrinth than a structural plan. The task was monumental: a skyscraper that challenged gravity and aesthetics. But the challenge wasn't just in the steel and glass; it was in the alignment of a thousand moving parts, hundreds of specialists, and the relentless march of the clock.
              </Txt>
            </View>
          </View>

          <Txt
            variant="body"
            style={{ fontSize: 15, lineHeight: 24, color: '#5d5f5f', marginTop: 20 }}
          >
            This is where Project Management transcends mere administration. It becomes an art of orchestration—the systematic approach to turning an abstract vision into a tangible reality within defined parameters. For Alex, it meant the difference between a landmark and a disaster.
          </Txt>

          <View style={{ width: 96, height: 4, backgroundColor: '#000000', marginTop: 32 }} />
        </View>
      </View>

      {/* Core Components Section */}
      <View style={{ paddingVertical: 60, paddingHorizontal: 24, backgroundColor: '#f3f3f3', borderTopWidth: 1, borderTopColor: TOKENS['outline-variant'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <Txt variant="display" style={{ fontSize: 28, letterSpacing: 3 }}>
            Core Components
          </Txt>
          <Txt variant="label" style={{ fontSize: 12, color: TOKENS.outline, letterSpacing: 4 }}>
            02 / 05
          </Txt>
        </View>

        {/* Component Cards Grid */}
        <View style={{ borderWidth: 1, borderColor: TOKENS['outline-variant'], gap: 1, backgroundColor: TOKENS['outline-variant'] }}>
          <ComponentCard
            symbol="target"
            title="The Goal"
            description="Defining the absolute destination. A project without a clear objective is merely an expensive exercise in movement."
            tag="Strategic Intent"
          />
          <ComponentCard
            symbol="schedule"
            title="Deadline"
            description="The temporal boundary. Time is the only non-renewable resource in the project management lifecycle."
            tag="Temporal Constraint"
          />
        </View>
      </View>

      {/* CTA Section */}
      <View style={{ paddingVertical: 60, paddingHorizontal: 24, backgroundColor: '#ffffff', alignItems: 'center' }}>
        <Txt
          variant="body"
          style={{ fontSize: 17, lineHeight: 26, color: '#5d5f5f', fontStyle: 'italic', textAlign: 'center', marginBottom: 32, maxWidth: 360 }}
        >
          "Project management is not just about completing a task; it's about mastering the process of transformation."
        </Txt>
        <Button label="Continue Story" onPress={onContinue} />
      </View>
    </ScrollView>
  );
}

type CardProps = {
  symbol: string;
  title: string;
  description: string;
  tag: string;
};

function ComponentCard({ symbol, title, description, tag }: CardProps) {
  return (
    <PressableFeedback onPress={() => {}} className="">
      <View style={{ backgroundColor: '#ffffff', padding: 32 }}>
        <View style={{ marginBottom: 20 }}>
          <Icon symbol={symbol} size={32} color="#000000" />
        </View>
        <Txt variant="body" style={{ fontSize: 17, fontWeight: '700', textTransform: 'uppercase', color: '#000000', marginBottom: 10 }}>
          {title}
        </Txt>
        <Txt variant="body" style={{ fontSize: 13, lineHeight: 20, color: '#5d5f5f', maxWidth: 280 }}>
          {description}
        </Txt>
        <View style={{ paddingTop: 20, marginTop: 16, borderTopWidth: 1, borderTopColor: TOKENS['outline-variant'] }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 2, color: '#000000' }}>
            {tag}
          </Txt>
        </View>
      </View>
    </PressableFeedback>
  );
}
