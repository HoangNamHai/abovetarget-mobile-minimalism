import React from 'react';
import { StyleSheet, View } from 'react-native';
import { QuizScreen } from '../../components/quiz/QuizScreen';
import { Txt } from '../../components/primitives/Txt';
import { Hairline } from '../../components/primitives/Hairline';
import { ELITE_BRUTALISM_QUIZ, MONOGRAPH_QUIZ_1 } from '../../data/questions';
import { useSession } from '../../contexts/session-context';
import { useBrand } from '../../theme/brand-context';
import { TOKENS } from '../../theme/tokens';

export default function Metrics() {
  const { brand } = useBrand();
  const { state } = useSession();

  const question = brand === 'elite' ? ELITE_BRUTALISM_QUIZ : MONOGRAPH_QUIZ_1;

  return (
    <View style={styles.container}>
      {/* Stat readout */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Txt variant="display" style={styles.statNumber}>
            {state.streak}
          </Txt>
          <Txt variant="label" style={styles.statLabel}>
            STREAK
          </Txt>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Txt variant="display" style={styles.statNumber}>
            {state.points}
          </Txt>
          <Txt variant="label" style={styles.statLabel}>
            POINTS
          </Txt>
        </View>
      </View>
      <Hairline />
      {/* Quiz question */}
      <View style={styles.quizContainer}>
        <QuizScreen question={question} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 36,
    color: TOKENS['on-background'],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TOKENS.outline,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: TOKENS['outline-variant'],
  },
  quizContainer: {
    flex: 1,
  },
});
