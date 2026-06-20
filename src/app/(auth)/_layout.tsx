import { Stack } from 'expo-router';
import { TOKENS } from '../../theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: TOKENS.background },
      }}
    />
  );
}
