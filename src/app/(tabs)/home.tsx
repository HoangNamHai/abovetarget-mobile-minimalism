import { router } from 'expo-router';
import { DashboardScreen } from '../../components/dashboard/DashboardScreen';

export default function Home() {
  return (
    <DashboardScreen
      onStartStudy={() => router.push('/(tabs)/study')}
      onJoinArena={() => router.push('/(tabs)/study')}
    />
  );
}
