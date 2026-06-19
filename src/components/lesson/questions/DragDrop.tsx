import React, { useState, useRef, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { dragDropPlacement, allChipsPlaced } from '../scoring';
import { Txt } from '../../primitives/Txt';
import { Button } from '../../primitives/Button';
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
      <Txt variant="display">{question.question}</Txt>

      {/* Drop Zones */}
      <View style={{ gap: 12 }}>
        {question.dropZones.map((zone) => {
          const placed = zoneChips(zone.id);

          return (
            <Pressable
              key={zone.id}
              testID={`zone-${zone.id}`}
              disabled={done}
              onPress={() => {
                if (done) return;
                handleZonePress(zone.id);
              }}
              style={{
                borderWidth: 1,
                borderColor: selectedChipId ? '#6B7FD7' : '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                minHeight: 56,
                backgroundColor: selectedChipId && !done ? '#F0F3FF' : '#F9FAFB',
              }}
            >
              <Txt variant="label">{zone.label}</Txt>
              {zone.detail ? <Txt variant="body">{zone.detail}</Txt> : null}
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
                    backgroundColor: '#E0E7FF',
                    borderRadius: 16,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Txt variant="body">{chip.label}</Txt>
                </Pressable>
              ))}
            </Pressable>
          );
        })}
      </View>

      {/* Chip Tray */}
      {!done && trayChips.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {trayChips.map((chip) => (
            <Pressable
              key={chip.id}
              disabled={done}
              onPress={() => {
                if (done) return;
                const next = selectedChipIdRef.current === chip.id ? null : chip.id;
                selectChip(next);
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: selectedChipId === chip.id ? '#6B7FD7' : '#E5E7EB',
                borderRadius: 20,
              }}
            >
              <Txt variant="body">{chip.label}</Txt>
            </Pressable>
          ))}
        </View>
      )}

      {/* Check Answer button — only rendered when all chips are placed */}
      {!done && canCheck && (
        <Button
          label="Check Answer"
          onPress={() => checkAnswer(question, isLastQuestion)}
        />
      )}
    </View>
  );
}
