import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import {
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { View } from 'react-native';

export function FontGate({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    Anton: Anton_400Regular,
    'Hanken Grotesk': HankenGrotesk_400Regular,
    'Hanken Grotesk Light': HankenGrotesk_300Light,
    'Hanken Grotesk Medium': HankenGrotesk_500Medium,
    'Hanken Grotesk Bold': HankenGrotesk_700Bold,
    'Hanken Grotesk ExtraBold': HankenGrotesk_800ExtraBold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#f9f9f9' }} />;
  return <>{children}</>;
}
