import { router } from 'expo-router';
import { DashboardScreen } from '../../components/dashboard/DashboardScreen';

export default function Home() {
  return (
    <DashboardScreen
      onStartStudy={() => router.navigate('/(tabs)/study')}
      onJoinArena={() => router.navigate('/(tabs)/metrics')}
    />
  );
}
