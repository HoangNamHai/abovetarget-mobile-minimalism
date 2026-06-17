import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';
import { Icon } from '../../components/primitives/Icon';
import { useBrand } from '../../theme/brand-context';

const BRAND_ICONS = {
  monograph: {
    home: 'home',
    study: 'school',
    metrics: 'insights',
    profile: 'shopping_bag',
  },
  elite: {
    home: 'home',
    study: 'school',
    metrics: 'insights',
    profile: 'account_circle',
  },
} as const;

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Icon symbol={symbol} color={String(color)} size={24} />;
}

export default function TabsLayout() {
  const { brand } = useBrand();
  const icons = BRAND_ICONS[brand];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#7e7576',
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol={icons.home} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol={icons.study} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: 'Metrics',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol={icons.metrics} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol={icons.profile} color={color} />
          ),
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
