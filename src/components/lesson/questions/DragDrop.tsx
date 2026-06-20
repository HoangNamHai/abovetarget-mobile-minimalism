import React, { useState, useRef, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { dragDropPlacement, allChipsPlaced } from '../scoring';
import { Txt } from '../../primitives/Txt';
import { Appear } from '../../primitives/Appear';
import { Button } from '../../primitives/Button';
import { QuestionPrompt } from './QuestionPrompt';
import { TOKENS, RADIUS } from '../../../theme/tokens';
import type { DragChip, DragDropQuestion } from '../../../types/lesson';

export function DragDrop({
  question,
  isLastQuestion,
}: {
  question: DragDropQuestion;
  isLastQuestion: boolean;
}) {
  const { state, setDropZoneAnswer, isQuestionCompleted } = useLesson();
  const { checkAnswer } = useCheckAnswer();

  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  // useRef keeps latest value in closures between React render cycles
  const selectedChipIdRef = useRef<string | null>(null);

  const selectChip = (chipId: string | null) => {
    selectedChipIdRef.current = chipId;
    setSelectedChipId(chipId);
  };

  const qId = question.q_id;
  const answers = state.dropZoneAnswers[qId] ?? {};
  // Ref so onPress handlers always read latest answers (avoids stale closure)
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Stable ref to setDropZoneAnswer to avoid stale captures
  const setDropZoneAnswerRef = useRef(setDropZoneAnswer);
  setDropZoneAnswerRef.current = setDropZoneAnswer;

  const done = isQuestionCompleted(qId);

  // Helper to read a zone's chips as an array — reads from ref for freshness
  const zoneChips = useCallback((zoneId: string): DragChip[] => {
    const c = answersRef.current[zoneId];
    return Array.isArray(c) ? c : c ? [c] : [];
  }, []); // stable - reads from ref

  // Stable handler for pressing a zone
  const handleZonePress = useCallback((zoneId: string) => {
    const currentSelected = selectedChipIdRef.current;
    if (!currentSelected) return;
    const chip = question.chips.find((c) => c.id === currentSelected);
    if (!chip) return;
    const current = zoneChips(zoneId);
    setDropZoneAnswerRef.current(question.q_id, zoneId, [...current, chip]);
    setSelectedChipId(null);
    selectedChipIdRef.current = null;
  }, [question.chips, question.q_id, zoneChips]);

  // Stable handler for removing a chip from a zone
  const handleChipRemove = useCallback((zoneId: string, chipId: string) => {
    const remaining = zoneChips(zoneId).filter((c) => c.id !== chipId);
    setDropZoneAnswerRef.current(question.q_id, zoneId, remaining.length ? remaining : null);
    setSelectedChipId(null);
    selectedChipIdRef.current = null;
  }, [question.q_id, zoneChips]);

  // Map from chipId -> zoneId for chips that have been placed
  const placement = dragDropPlacement(answers);

  // Chips NOT yet placed are in the tray
  const trayChips = question.chips.filter((c) => placement[c.id] === undefined);

  // Check Answer enabled only when all chips are placed
  const canCheck = allChipsPlaced(question, answers);

  return (
    <View style={{ gap: 16 }}>
      <QuestionPrompt>{question.question}</QuestionPrompt>

      {/* Drop Zones */}
      <View style={{ gap: 12 }}>
        {question.dropZones.map((zone, idx) => {
          const placed = zoneChips(zone.id);

          return (
            <Appear key={zone.id} index={idx + 1}>
            <Pressable
              testID={`zone-${zone.id}`}
              disabled={done}
              onPress={() => {
                if (done) return;
                handleZonePress(zone.id);
              }}
              style={{
                borderWidth: 1,
                borderColor: selectedChipId && !done ? TOKENS.primary : TOKENS['outline-variant'],
                borderRadius: RADIUS.card,
                padding: 12,
                minHeight: 56,
                backgroundColor:
                  selectedChipId && !done
                    ? TOKENS['surface-container-low']
                    : TOKENS['surface-container-lowest'],
              }}
            >
              <Txt variant="label" style={{ color: TOKENS['on-background'] }}>
                {zone.label}
              </Txt>
              {zone.detail ? (
                <Txt variant="body" style={{ color: TOKENS.outline }}>
                  {zone.detail}
                </Txt>
              ) : null}
              {/* Render ALL placed chips in the zone */}
              {placed.map((chip) => (
                <Pressable
                  key={chip.id}
                  testID={`placed-${chip.id}`}
                  disabled={done}
                  onPress={() => {
                    if (done) return;
                    handleChipRemove(zone.id, chip.id);
                  }}
                  style={{
                    marginTop: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: TOKENS.primary,
                    borderRadius: RADIUS.pill,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Txt variant="body" style={{ color: TOKENS['on-primary'] }}>
                    {chip.label}
                  </Txt>
                </Pressable>
              ))}
            </Pressable>
            </Appear>
          );
        })}
      </View>

      {/* Chip Tray */}
      {!done && trayChips.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {trayChips.map((chip, i) => (
            // Capped stagger: keeps a nice cascade on first load while staying
            // snappy when a single chip re-mounts (returned from a drop zone).
            <Appear key={chip.id} delay={Math.min(i, 6) * 50}>
              <Pressable
                disabled={done}
                onPress={() => {
                  if (done) return;
                  const next = selectedChipIdRef.current === chip.id ? null : chip.id;
                  selectChip(next);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor:
                    selectedChipId === chip.id ? TOKENS.primary : TOKENS['surface-container-high'],
                  borderWidth: 1,
                  borderColor:
                    selectedChipId === chip.id ? TOKENS.primary : TOKENS['outline-variant'],
                  borderRadius: RADIUS.pill,
                }}
              >
                <Txt
                  variant="body"
                  style={{
                    color: selectedChipId === chip.id ? TOKENS['on-primary'] : TOKENS['on-background'],
                  }}
                >
                  {chip.label}
                </Txt>
              </Pressable>
            </Appear>
          ))}
        </View>
      )}

      {/* Check Answer button — only rendered when all chips are placed */}
      {!done && canCheck && (
        <Appear>
          <Button
            label="Check Answer"
            onPress={() => checkAnswer(question, isLastQuestion)}
          />
        </Appear>
      )}
    </View>
  );
}
