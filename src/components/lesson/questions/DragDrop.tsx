import React, { useState, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { dragDropPlacement, allChipsPlaced } from '../scoring';
import { Txt } from '../../primitives/Txt';
import { Button } from '../../primitives/Button';
import type { DragDropQuestion } from '../../../types/lesson';

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
  const done = isQuestionCompleted(qId);

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
          const placedContent = answers[zone.id];
          // Support single chip or array; take the first/only chip for display
          const placedChip = placedContent
            ? Array.isArray(placedContent)
              ? placedContent[0] ?? null
              : placedContent
            : null;

          return (
            <Pressable
              key={zone.id}
              testID={`zone-${zone.id}`}
              disabled={done}
              onPress={() => {
                if (done) return;
                // Always read from ref to get the latest selection even if closure is stale
                const currentSelected = selectedChipIdRef.current;
                if (currentSelected) {
                  const chip = question.chips.find((c) => c.id === currentSelected);
                  if (chip) {
                    setDropZoneAnswer(qId, zone.id, chip);
                    selectChip(null);
                  }
                }
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
              {placedChip ? (
                <Pressable
                  testID={`placed-${placedChip.id}`}
                  disabled={done}
                  onPress={() => {
                    if (done) return;
                    // Return chip to tray
                    setDropZoneAnswer(qId, zone.id, null);
                    selectChip(null);
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
                  <Txt variant="body">{placedChip.label}</Txt>
                </Pressable>
              ) : null}
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

      {/* Check Answer button */}
      {!done && (
        <Button
          label="Check Answer"
          onPress={() => checkAnswer(question, isLastQuestion)}
        />
      )}
    </View>
  );
}
