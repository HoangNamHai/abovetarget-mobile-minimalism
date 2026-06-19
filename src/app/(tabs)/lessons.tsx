import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LessonsList } from '../../components/lessons/LessonsList';
import type { Domain } from '../../types/progress';

const DOMAINS: Domain[] = ['people', 'process', 'business'];

export default function Study() {
  const { domain } = useLocalSearchParams<{ domain?: string }>();
  const domainFilter = DOMAINS.includes(domain as Domain) ? (domain as Domain) : undefined;
  return <LessonsList domainFilter={domainFilter} />;
}
