import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';
import { Icon } from '../../components/primitives/Icon';

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Icon symbol={symbol} color={String(color)} size={24} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // No nav header on tab roots — each screen renders its own content and
        // handles the top safe-area inset. An empty header just wasted vertical space.
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#7e7576',
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="home" color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="school" color={color} />,
          tabBarLabel: 'Lessons',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="account_circle" color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#cfc4c5',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
