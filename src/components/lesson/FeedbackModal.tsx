import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLesson } from '../../contexts/lesson-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Txt } from '../primitives/Txt';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onSuccessNext: () => void;
  onRetry: () => void;
  onReveal: () => void;
};

// ─── FeedbackModal ────────────────────────────────────────────────────────────

export function FeedbackModal({ onSuccessNext, onRetry, onReveal }: Props) {
  const { state, closeModal } = useLesson();
  const sheetRef = useRef<BottomSheetModal>(null);

  // Present / dismiss the sheet based on lesson modal state
  useEffect(() => {
    if (state.modalVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [state.modalVisible]);

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

  const handleDismiss = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['75%']}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
    >
      <BottomSheetView style={styles.sheetView}>
        {state.modalVisible && state.modalType === 'success' && (
          <SuccessBody
            points={state.modalData?.points}
            explanation={state.modalData?.explanation}
            onAction={handleSuccess}
          />
        )}
        {state.modalVisible && state.modalType === 'retry' && (
          <RetryBody
            hint={state.modalData?.hint}
            onAction={handleRetry}
          />
        )}
        {state.modalVisible && state.modalType === 'reveal' && (
          <RevealBody
            correctAnswer={state.modalData?.correctAnswer}
            explanation={state.modalData?.explanation}
            onAction={handleReveal}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
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
    <View style={[styles.body, { backgroundColor: TOKENS['surface-container-lowest'] }]}>
      <Txt variant="display" style={[styles.headline, { color: TOKENS['on-background'] }]}>
        EXCELLENT WORK.
      </Txt>
      {points != null && (
        <Txt variant="label" style={[styles.points, { color: TOKENS.primary }]}>
          +{points} pts
        </Txt>
      )}
      <Hairline />
      {explanation != null && (
        <Txt variant="body" style={[styles.explanation, { color: TOKENS['on-background'] }]}>
          {explanation}
        </Txt>
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
    <View style={[styles.body, { backgroundColor: '#DC2626' }]}>
      <Txt variant="display" style={[styles.headline, { color: '#ffffff' }]}>
        NOT QUITE.
      </Txt>
      {hint != null && (
        <Txt variant="body" style={[styles.explanation, { color: 'rgba(255,255,255,0.9)' }]}>
          {hint}
        </Txt>
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
    <View style={[styles.body, { backgroundColor: TOKENS['surface-container-lowest'] }]}>
      <Txt variant="display" style={[styles.headline, { color: TOKENS['on-background'] }]}>
        HERE'S THE ANSWER.
      </Txt>
      {correctAnswer != null && (
        <Txt variant="label" style={[styles.label, { color: TOKENS.primary }]}>
          {correctAnswer}
        </Txt>
      )}
      <Hairline />
      {explanation != null && (
        <Txt variant="body" style={[styles.explanation, { color: TOKENS['on-background'] }]}>
          {explanation}
        </Txt>
      )}
      <View style={styles.footer}>
        <Button label="Continue" onPress={onAction} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetView: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 48,
    lineHeight: 52,
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
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto',
  },
});
