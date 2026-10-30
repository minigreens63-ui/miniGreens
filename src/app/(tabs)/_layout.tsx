import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { PressableScale } from '../../components/ui/PressableScale';

const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index',         label: 'Home',    icon: 'home' },
  { name: 'explore',       label: 'Search',  icon: 'search' },
  { name: 'orders',        label: 'Orders',   icon: 'receipt' },
  { name: 'subscriptions', label: 'Plans',    icon: 'calendar' },
  { name: 'profile',       label: 'Profile',  icon: 'person' },
];

function BottomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.barWrap}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(state.routes[index].name);
          }
        };
        const tint = focused ? colors.primary : colors.textTertiary;

        return (
          <PressableScale key={tab.name} onPress={onPress} scaleTo={0.94} wrapperStyle={styles.itemWrap} style={styles.item} accessibilityLabel={tab.label}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? tab.icon : (`${tab.icon}-outline` as any)}
                size={22}
                color={tint}
              />
            </View>
            <Typography variant="caption" color={tint} weight={focused ? 'semibold' : 'regular'} style={styles.label}>
              {tab.label}
            </Typography>
          </PressableScale>
        );
      })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"         options={{ title: 'Home' }} />
      <Tabs.Screen name="explore"       options={{ title: 'Explore' }} />
      <Tabs.Screen name="orders"        options={{ title: 'Orders' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Plans' }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'relative',
  },
  bar: {
    flexDirection: 'row',
    // Light layer above the content — depth from the top hairline + soft
    // upward shadow, matching the reference bottom nav.
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
    shadowColor: '#26401F',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 12,
  },
  itemWrap: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentSurface,
  },
  label: {
    fontSize: 10,
  },
});
