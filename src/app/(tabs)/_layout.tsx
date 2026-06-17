import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type { ColorValue } from 'react-native';
import { BrandSwitch } from '../../components/primitives/BrandSwitch';
import { FeedbackSheet } from '../../components/feedback/FeedbackSheet';
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

function HeaderRight() {
  return (
    <View style={styles.headerRight}>
      <BrandSwitch />
    </View>
  );
}

export default function TabsLayout() {
  const { brand } = useBrand();
  const icons = BRAND_ICONS[brand];

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => <HeaderRight />,
          headerTitle: '',
          headerStyle: styles.header,
          headerShadowVisible: false,
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#7e7576',
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color }) => (
              <TabIcon symbol={icons.home} color={color} />
            ),
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="study"
          options={{
            tabBarIcon: ({ color }) => (
              <TabIcon symbol={icons.study} color={color} />
            ),
            tabBarLabel: 'Study',
          }}
        />
        <Tabs.Screen
          name="metrics"
          options={{
            tabBarIcon: ({ color }) => (
              <TabIcon symbol={icons.metrics} color={color} />
            ),
            tabBarLabel: 'Metrics',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => (
              <TabIcon symbol={icons.profile} color={color} />
            ),
            tabBarLabel: 'Profile',
          }}
        />
      </Tabs>
      {/* FeedbackSheet mounted once here so it overlays all tabs */}
      <FeedbackSheet />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
  },
  headerRight: {
    paddingRight: 16,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#cfc4c5',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
