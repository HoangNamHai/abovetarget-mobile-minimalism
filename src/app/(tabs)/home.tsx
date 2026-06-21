import { router } from 'expo-router';
import { DashboardScreen } from '../../components/dashboard/DashboardScreen';

export default function Home() {
  return (
    <DashboardScreen
      onStartStudy={() => router.push('/(tabs)/lessons')}
      onOpenLesson={(lessonId) => router.push(`/lesson/${lessonId}`)}
      onOpenDomain={(domain) => router.push(`/(tabs)/lessons?domain=${domain}`)}
      onUpgrade={() => router.push('/paywall')}
    />
  );
}
