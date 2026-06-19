import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LessonPlayer } from '../../components/lesson/LessonPlayer';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonPlayer lessonId={id} />;
}
