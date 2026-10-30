import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

interface ToggleSetting {
  type: 'toggle';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  key: string;
}

interface NavSetting {
  type: 'nav';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  route?: string;
}

type SettingItem = ToggleSetting | NavSetting;

function buildSettingSections(defaultAddressLabel: string): { title: string; items: SettingItem[] }[] {
  return [
    {
      title: 'Notifications',
      items: [
        { type: 'toggle', icon: 'notifications-outline', label: 'Push Notifications', key: 'push' },
        { type: 'toggle', icon: 'mail-outline', label: 'Email Updates', subtitle: 'Promos, tips & freshness alerts', key: 'email' },
        { type: 'toggle', icon: 'bicycle-outline', label: 'Order Updates', subtitle: 'Delivery status changes', key: 'orderUpdates' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { type: 'nav', icon: 'language-outline', label: 'Language', value: 'English' },
        { type: 'nav', icon: 'location-outline', label: 'Default Address', value: defaultAddressLabel, route: '/profile/addresses' },
        { type: 'toggle', icon: 'moon-outline', label: 'Dark Mode', key: 'darkMode' },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { type: 'nav', icon: 'shield-outline', label: 'Privacy Policy', route: '/profile/privacy' },
        { type: 'nav', icon: 'document-text-outline', label: 'Terms of Service', route: '/profile/terms' },
        { type: 'nav', icon: 'return-up-back-outline', label: 'Returns & Refunds', route: '/profile/returns' },
        { type: 'nav', icon: 'bicycle-outline', label: 'Shipping Policy', route: '/profile/shipping-policy' },
        { type: 'toggle', icon: 'analytics-outline', label: 'Analytics', subtitle: 'Help us improve the app', key: 'analytics' },
      ],
    },
  ];
}

// ─── Branded pill toggle — replaces the stock RN Switch ────────────────────

function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? colors.primary : colors.border,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      hitSlop={8}
    >
      <Animated.View style={[styles.toggleTrack, trackStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function SettingRow({
  item,
  isLast,
  delay,
  toggleValue,
  onToggle,
}: {
  item: SettingItem;
  isLast: boolean;
  delay: number;
  toggleValue?: boolean;
  onToggle?: (key: string, val: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isInteractive = item.type === 'toggle' || !!item.route;

  const handlePress = () => {
    if (item.type === 'nav' && item.route) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(item.route as any);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(31).mass(1).stiffness(100)}
      style={animStyle}
    >
      <Pressable
        style={[styles.row, !isLast && styles.rowBorder]}
        onPressIn={() => { if (isInteractive) scale.value = withSpring(0.98, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPress={handlePress}
        disabled={!isInteractive}
      >
        <View style={styles.rowIcon}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.rowContent}>
          <Typography variant="body" color={colors.text}>{item.label}</Typography>
          {item.type === 'toggle' && item.subtitle && (
            <Typography variant="caption" color={colors.textTertiary}>{item.subtitle}</Typography>
          )}
        </View>
        {item.type === 'toggle' ? (
          <Toggle
            value={!!toggleValue}
            onValueChange={(val) => onToggle?.(item.key, val)}
          />
        ) : (
          <View style={styles.navRight}>
            {item.value && (
              <Typography variant="caption" color={colors.textTertiary} style={{ marginRight: spacing.sm }}>
                {item.value}
              </Typography>
            )}
            {item.route && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    push: true,
    email: false,
    orderUpdates: true,
    darkMode: false,
    analytics: true,
  });
  const [defaultAddressLabel, setDefaultAddressLabel] = useState('Not set');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete your account?',
      "This removes your personal info (name, email, phone, date of birth, addresses) and cancels any active subscription. Your past orders stay in our records for billing and tax purposes, but will no longer be linked to you by name. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteAccount();
            setIsDeleting(false);
            if (error) {
              Alert.alert("Couldn't delete account", error);
              return;
            }
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('addresses')
      .select('label')
      .eq('profile_id', profile.id)
      .eq('is_default', true)
      .maybeSingle()
      .then(({ data }) => setDefaultAddressLabel(data?.label ?? 'Not set'));
  }, [profile]);

  const settingSections = buildSettingSections(defaultAddressLabel);

  let rowDelay = 80;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.headerButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="body" weight="semibold">Settings</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {settingSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Animated.View entering={FadeInUp.delay(rowDelay).springify().damping(31).mass(1).stiffness(100)}>
              <Typography
                variant="caption"
                weight="semibold"
                color={colors.textTertiary}
                uppercase
                style={styles.sectionTitle}
              >
                {section.title}
              </Typography>
            </Animated.View>
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => {
                rowDelay += 60;
                return (
                  <SettingRow
                    key={ii}
                    item={item}
                    isLast={ii === section.items.length - 1}
                    delay={rowDelay}
                    toggleValue={item.type === 'toggle' ? toggles[item.key] : undefined}
                    onToggle={(key, val) => setToggles((prev) => ({ ...prev, [key]: val }))}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <Animated.View
          entering={FadeInUp.delay(rowDelay + 60).springify().damping(31).mass(1).stiffness(100)}
          style={styles.section}
        >
          <Typography
            variant="caption"
            weight="semibold"
            color={colors.textTertiary}
            uppercase
            style={styles.sectionTitle}
          >
            Account
          </Typography>
          <Pressable
            style={[styles.sectionCard, styles.dangerRow]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            accessibilityLabel="Delete account"
          >
            <View style={[styles.rowIcon, styles.dangerIcon]}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </View>
            <View style={styles.rowContent}>
              <Typography variant="body" color={colors.error}>
                {isDeleting ? 'Deleting account…' : 'Delete Account'}
              </Typography>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(rowDelay + 120).springify().damping(31).mass(1).stiffness(100)}
          style={styles.versionRow}
        >
          <Typography variant="caption" color={colors.textTertiary} style={{ textAlign: 'center' }}>
            MiniGreens v1.0.0
          </Typography>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['8xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  dangerIcon: {
    backgroundColor: colors.errorLight,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionRow: {
    marginTop: spacing.xl,
  },
  toggleTrack: {
    width: 46,
    height: 27,
    borderRadius: borderRadius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 21,
    height: 21,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
});
