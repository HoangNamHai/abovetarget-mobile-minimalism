import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSession } from '../../contexts/session-context';
import { Question } from '../../data/questions';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Txt } from '../primitives/Txt';
import { QuizOption } from './QuizOption';

type Props = {
  question: Question;
};

// Determine visual variant based on question id
function getVariant(question: Question): 'monograph' | 'elite-standard' | 'elite-brutalism' | 'elite-luxury' {
  if (question.brand === 'monograph') return 'monograph';
  if (question.id === 'elite-brutalism-q7') return 'elite-brutalism';
  if (question.id === 'elite-luxury-q4') return 'elite-luxury';
  return 'elite-standard';
}

export function QuizScreen({ question }: Props) {
  const { state, dispatch } = useSession();
  const selectedKey = state.selected[question.id] ?? null;
  const variant = getVariant(question);

  function handleSelect(key: string) {
    dispatch({ type: 'SELECT', questionId: question.id, key });
  }

  function handleCheck() {
    dispatch({ type: 'CHECK', questionId: question.id, correctKey: question.correctKey });
  }

  // ─── Monograph layout ─────────────────────────────────────────────────────────
  if (variant === 'monograph') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Txt variant="label" style={styles.labelSmall}>
            {question.numberInfo}
          </Txt>
        </View>

        {/* Scenario card */}
        <View style={[styles.scenarioCard, styles.monographCard]}>
          <Txt variant="body" style={styles.scenarioText}>
            {question.questionText}
          </Txt>
        </View>

        {/* Question prompt */}
        <View style={styles.promptRow}>
          <Txt variant="display" style={styles.displayQuestion}>
            Classify this work:
          </Txt>
          <View style={styles.accentBar} />
        </View>

        <Hairline />
        <View style={styles.optionsGap} />

        {/* Options */}
        <FlashList
          data={question.options}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <QuizOption
              option={item}
              selected={selectedKey === item.key}
              brand={question.brand}
              onPress={() => handleSelect(item.key)}
            />
          )}
          scrollEnabled={false}
        />

        <View style={styles.optionsGap} />
        <Hairline />
        <View style={styles.checkRow}>
          <Button label="Check Answer" onPress={handleCheck} />
        </View>
      </ScrollView>
    );
  }

  // ─── Elite Standard layout (e.g. ELITE_QUIZ_12) ──────────────────────────────
  if (variant === 'elite-standard') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Progress header */}
        <View style={styles.progressRow}>
          <Txt variant="label" style={styles.labelSmall}>
            {question.module}
          </Txt>
          <Txt variant="label" style={[styles.labelSmall, styles.labelRight]}>
            {question.numberInfo}
          </Txt>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Txt variant="display" style={[styles.displayQuestion, styles.displayElite]}>
            {question.questionText}
          </Txt>
          <View style={styles.accentBar} />
        </View>

        {/* Options */}
        <FlashList
          data={question.options}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <QuizOption
              option={item}
              selected={selectedKey === item.key}
              brand={question.brand}
              onPress={() => handleSelect(item.key)}
            />
          )}
          scrollEnabled={false}
        />

        <View style={styles.optionsGap} />
        <Hairline />
        <View style={styles.checkRow}>
          <Button label="Check Answer" onPress={handleCheck} />
        </View>
      </ScrollView>
    );
  }

  // ─── Elite Brutalism layout (elite-brutalism-q7) ──────────────────────────────
  if (variant === 'elite-brutalism') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.progressRow}>
          <View>
            <Txt variant="label" style={styles.labelSmall}>
              {question.module}
            </Txt>
            <Txt variant="display" style={[styles.displayTitle, { color: TOKENS['on-background'] }]}>
              Elite Theory Assessment
            </Txt>
          </View>
          <Txt variant="display" style={styles.brutalismNumber}>
            {question.numberInfo}
          </Txt>
        </View>

        <Hairline />
        <View style={styles.optionsGap} />

        {/* Question */}
        <Txt variant="body" style={styles.brutalismQuestion}>
          {question.questionText}
        </Txt>

        <View style={styles.optionsGap} />

        {/* Options with heavier border treatment */}
        <FlashList
          data={question.options}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <BrutalismOption
              option={item}
              selected={selectedKey === item.key}
              onPress={() => handleSelect(item.key)}
            />
          )}
          scrollEnabled={false}
        />

        <View style={styles.optionsGap} />
        <Button label="Check Answer" onPress={handleCheck} />
      </ScrollView>
    );
  }

  // ─── Elite Luxury layout (elite-luxury-q4) ────────────────────────────────────
  // Bento/grid style with numbered choices
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress header */}
      <View style={styles.progressRow}>
        <Txt variant="label" style={styles.labelSmall}>
          {question.numberInfo}
        </Txt>
      </View>
      <Hairline />

      <View style={styles.optionsGap} />

      {/* Question */}
      <View style={styles.questionSection}>
        <Txt variant="display" style={[styles.displayQuestion, styles.displayElite]}>
          {question.questionText}
        </Txt>
        <View style={styles.accentBarShort} />
      </View>

      {/* Options as bento grid (2 cols) */}
      <View style={styles.luxuryGrid}>
        {question.options.map((item, idx) => (
          <LuxuryOption
            key={item.key}
            option={item}
            choiceLabel={`CHOICE ${item.key}`}
            selected={selectedKey === item.key}
            onPress={() => handleSelect(item.key)}
          />
        ))}
      </View>

      <View style={styles.optionsGap} />
      <Hairline />
      <View style={styles.checkRow}>
        <Button label="Check Answer" onPress={handleCheck} />
      </View>
    </ScrollView>
  );
}

// ─── Brutalism sub-option ─────────────────────────────────────────────────────

type SubOptionProps = {
  option: { key: string; label: string; icon?: string };
  selected: boolean;
  onPress: () => void;
};

function BrutalismOption({ option, selected, onPress }: SubOptionProps) {
  const bg = selected ? TOKENS.primary : TOKENS['surface-container-lowest'];
  const textColor = selected ? TOKENS['on-primary'] : TOKENS['on-background'];
  const keyColor = selected ? 'rgba(255,255,255,0.6)' : TOKENS.outline;

  return (
    <PressableView onPress={onPress}>
      <View
        style={[
          styles.brutalismOption,
          { backgroundColor: bg, borderColor: selected ? TOKENS.primary : TOKENS['on-background'] },
        ]}
      >
        <View style={styles.row}>
          <Txt variant="label" style={[styles.optionKey, { color: keyColor }]}>
            {option.key}
          </Txt>
          <Txt variant="body" style={[styles.label, { color: textColor }]}>
            {option.label}
          </Txt>
        </View>
      </View>
    </PressableView>
  );
}

// ─── Luxury sub-option ────────────────────────────────────────────────────────

type LuxuryOptionProps = {
  option: { key: string; label: string };
  choiceLabel: string;
  selected: boolean;
  onPress: () => void;
};

function LuxuryOption({ option, choiceLabel, selected, onPress }: LuxuryOptionProps) {
  const bg = selected ? TOKENS.primary : TOKENS['surface-container-lowest'];
  const textColor = selected ? TOKENS['on-primary'] : TOKENS['on-background'];
  const subColor = selected ? 'rgba(255,255,255,0.7)' : TOKENS.outline;

  return (
    <PressableView onPress={onPress}>
      <View
        style={[
          styles.luxuryOption,
          { backgroundColor: bg, borderColor: selected ? TOKENS.primary : TOKENS['outline-variant'] },
        ]}
      >
        <Txt variant="label" style={[styles.luxuryChoiceLabel, { color: subColor }]}>
          {choiceLabel}
        </Txt>
        <Txt variant="body" style={[styles.luxuryLabel, { color: textColor }]}>
          {option.label}
        </Txt>
      </View>
    </PressableView>
  );
}

// ─── Simple pressable wrapper (no animation needed here, real PressableFeedback used in QuizOption) ──

import { Pressable } from 'react-native';

function PressableView({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return <Pressable onPress={onPress}>{children}</Pressable>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TOKENS.outline,
  },
  labelRight: {
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: TOKENS['outline-variant'],
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: TOKENS.primary,
    width: '60%',
  },
  monographCard: {
    borderWidth: 1,
    borderColor: TOKENS.primary,
    borderRadius: 2,
    backgroundColor: TOKENS['surface-container-lowest'],
    padding: 24,
    marginBottom: 20,
  },
  scenarioCard: {},
  scenarioText: {
    fontSize: 17,
    lineHeight: 26,
    color: TOKENS['on-background'],
  },
  promptRow: {
    marginBottom: 16,
    marginTop: 8,
  },
  displayQuestion: {
    fontSize: 28,
    lineHeight: 34,
    textTransform: 'uppercase',
    color: TOKENS['on-background'],
    marginBottom: 12,
  },
  displayElite: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  displayTitle: {
    fontSize: 20,
    textTransform: 'uppercase',
  },
  brutalismNumber: {
    fontSize: 32,
    color: TOKENS['on-background'],
  },
  brutalismQuestion: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    color: TOKENS['on-background'],
    marginBottom: 8,
  },
  accentBar: {
    height: 4,
    width: 96,
    backgroundColor: TOKENS.primary,
    marginBottom: 16,
  },
  accentBarShort: {
    height: 4,
    width: 64,
    backgroundColor: TOKENS.primary,
    marginBottom: 16,
  },
  questionSection: {
    marginBottom: 16,
  },
  optionsGap: {
    height: 16,
  },
  checkRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  // Brutalism option
  brutalismOption: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionKey: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    minWidth: 20,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  // Luxury (bento grid)
  luxuryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    backgroundColor: TOKENS['outline-variant'],
  },
  luxuryOption: {
    width: '49.9%',
    minHeight: 120,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  luxuryChoiceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  luxuryLabel: {
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
