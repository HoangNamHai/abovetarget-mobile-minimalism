import React, { useCallback } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLesson } from '../../contexts/lesson-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { RichText } from '../primitives/RichText';
import { ACCENTS } from '../../theme/accents';
import { FireworkBurst } from './FireworkBurst';

const SUCCESS_GREEN = ACCENTS.success;
const RETRY_RED = ACCENTS.error;
const REVEAL_INK = ACCENTS.revealInk;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onSuccessNext: () => void;
  onRetry: () => void;
  onReveal: () => void;
};

// ─── FeedbackModal ────────────────────────────────────────────────────────────
//
// Bottom-anchored feedback dialog shown after "Check Answer". Implemented with a
// plain React Native Modal (a previous @gorhom/bottom-sheet version rendered
// invisibly on the New Architecture, soft-locking the lesson).

export function FeedbackModal({ onSuccessNext, onRetry, onReveal }: Props) {
  const { state, closeModal } = useLesson();
  const insets = useSafeAreaInsets();

  const handleSuccess = useCallback(() => {
    onSuccessNext();
    closeModal();
  }, [onSuccessNext, closeModal]);

  const handleRetry = useCallback(() => {
    onRetry();
    closeModal();
  }, [onRetry, closeModal]);

  const handleReveal = useCallback(() => {
    onReveal();
    closeModal();
  }, [onReveal, closeModal]);

  const sheetColor =
    state.modalType === 'success'
      ? SUCCESS_GREEN
      : state.modalType === 'retry'
        ? RETRY_RED
        : REVEAL_INK;

  return (
    <Modal
      visible={state.modalVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeModal} />
        <View style={[styles.sheet, { backgroundColor: sheetColor }]}>
          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 24 }}
          >
            {state.modalType === 'success' && (
              <SuccessBody
                points={state.modalData?.points}
                explanation={state.modalData?.explanation}
                onAction={handleSuccess}
              />
            )}
            {state.modalType === 'retry' && (
              <RetryBody hint={state.modalData?.hint} onAction={handleRetry} />
            )}
            {state.modalType === 'reveal' && (
              <RevealBody
                correctAnswer={state.modalData?.correctAnswer}
                explanation={state.modalData?.explanation}
                onAction={handleReveal}
              />
            )}
          </ScrollView>
        </View>
        {state.modalType === 'success' && <FireworkBurst />}
      </View>
    </Modal>
  );
}

// ─── Success body ─────────────────────────────────────────────────────────────

type SuccessBodyProps = {
  points?: number;
  explanation?: string;
  onAction: () => void;
};

function SuccessBody({ points, explanation, onAction }: SuccessBodyProps) {
  return (
    <View>
      <Txt variant="display" style={[styles.headline, { color: '#ffffff' }]}>
        EXCELLENT WORK.
      </Txt>
      {points != null && (
        <Txt variant="label" style={[styles.points, { color: '#ffffff' }]}>
          +{points} pts
        </Txt>
      )}
      <View style={styles.lightDivider} />
      {explanation != null && (
        <RichText style={[styles.explanation, { color: 'rgba(255,255,255,0.92)' }]}>
          {explanation}
        </RichText>
      )}
      <View style={styles.footer}>
        <Button label="Continue" onPress={onAction} />
      </View>
    </View>
  );
}

// ─── Retry body ───────────────────────────────────────────────────────────────

type RetryBodyProps = {
  hint?: string;
  onAction: () => void;
};

function RetryBody({ hint, onAction }: RetryBodyProps) {
  return (
    <View>
      <Txt variant="display" style={[styles.headline, { color: '#ffffff' }]}>
        NOT QUITE.
      </Txt>
      {hint != null && (
        <RichText style={[styles.explanation, { color: 'rgba(255,255,255,0.9)' }]}>
          {hint}
        </RichText>
      )}
      <View style={styles.footer}>
        <Button label="Try Again" onPress={onAction} />
      </View>
    </View>
  );
}

// ─── Reveal body ─────────────────────────────────────────────────────────────

type RevealBodyProps = {
  correctAnswer?: string;
  explanation?: string;
  onAction: () => void;
};

function RevealBody({ correctAnswer, explanation, onAction }: RevealBodyProps) {
  return (
    <View>
      <Txt variant="display" style={[styles.headline, { color: '#ffffff' }]}>
        HERE'S THE ANSWER.
      </Txt>
      {correctAnswer != null && (
        <Txt variant="label" style={[styles.label, { color: '#ffffff' }]}>
          {correctAnswer}
        </Txt>
      )}
      <View style={styles.lightDivider} />
      {explanation != null && (
        <RichText style={[styles.explanation, { color: 'rgba(255,255,255,0.92)' }]}>
          {explanation}
        </RichText>
      )}
      <View style={styles.footer}>
        <Button label="Continue" onPress={onAction} variant="secondary" />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  headline: {
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  lightDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  explanation: {
    fontSize: 18,
    lineHeight: 28,
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    marginTop: 8,
  },
});
