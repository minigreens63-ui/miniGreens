import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/layout/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  route: string;
}

function getMenuSections(): { title: string; items: MenuItem[] }[] {
  return [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', subtitle: 'Update your personal details', route: '/profile/edit' },
        { icon: 'location-outline', label: 'Saved Addresses', subtitle: 'Manage your delivery addresses', route: '/profile/addresses' },
        { icon: 'pricetag-outline', label: 'My Offers', subtitle: 'View available offers and rewards', route: '/offers' },
        { icon: 'calendar-outline', label: 'My Subscription', subtitle: 'Manage your subscription plans', route: '/subscription/manage' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'settings-outline', label: 'Settings', subtitle: 'Notifications, privacy and more', route: '/profile/settings' },
        { icon: 'information-circle-outline', label: 'About', subtitle: 'App version, terms and policies', route: '/profile/about' },
        { icon: 'people-outline', label: 'Women Who Grow', subtitle: 'Our community and initiatives', route: '/women-who-grow' },
        { icon: 'call-outline', label: 'Contact Us', subtitle: 'Get in touch with our team', route: '/profile/contact' },
        { icon: 'help-circle-outline', label: 'FAQ', subtitle: 'Find answers to common questions', route: '/profile/faq' },
      ],
    },
  ];
}

// ─── Pressable Menu Row ───────────────────────────────────────────────────────

function MenuRow({
  item,
  isLast,
  delay,
  tone,
}: {
  item: MenuItem;
  isLast: boolean;
  delay: number;
  tone: 'green' | 'peach';
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconBg = tone === 'green' ? colors.accentSurface : colors.warningLight;
  const iconColor = tone === 'green' ? colors.primary : colors.warning;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(31).mass(1).stiffness(100)}
      style={animStyle}
    >
      <Pressable
        style={[styles.menuItem, !isLast && styles.menuItemBorder]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(item.route as any);
        }}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); }}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconBg, { backgroundColor: iconBg }]}>
            <Ionicons name={item.icon} size={20} color={iconColor} />
          </View>
          <View style={styles.menuItemText}>
            <Typography variant="body" weight="semibold" color={colors.text}>
              {item.label}
            </Typography>
            <Typography variant="caption" color={colors.textTertiary} style={styles.menuItemSubtitle}>
              {item.subtitle}
            </Typography>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const authProfile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const isPartner = authProfile?.role === 'partner';
  let itemDelay = 280;

  const displayName = authProfile?.full_name || 'MiniGreens member';
  const displayEmail = authProfile?.email || session?.user.email || '';
  const menuSections = getMenuSections();

  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const uid = authProfile?.id ?? session?.user.id;
      if (!uid) return;
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', uid)
        .then(({ count }) => setOrderCount(count ?? 0));
      supabase
        .from('addresses')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', uid)
        .then(({ count }) => setAddressCount(count ?? 0));
    }, [authProfile?.id, session?.user.id])
  );

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace('/auth/login');
  };

  // Signed out: show a sign-in prompt, not someone else's placeholder profile.
  if (!session && !authProfile) {
    return (
      <Screen title="Profile" subtitle="Your account, addresses and rewards." largeTitle showBack={false} scroll={false} hasTabBar>
        <EmptyState
          icon="person-outline"
          title="Log in to your account"
          message="See your orders, saved addresses and subscription in one place."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Animated.View
          entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)}
          style={styles.profileHeader}
        >
          <View pointerEvents="none" style={styles.headerFlourishTop}>
            <Ionicons name="leaf" size={110} color={colors.green[200]} style={styles.flourishLeafBack} />
            <Ionicons name="leaf" size={76} color={colors.primaryLight} style={styles.flourishLeafFront} />
          </View>
          <View pointerEvents="none" style={styles.headerFlourishBottom}>
            <Ionicons name="leaf" size={90} color={colors.green[100]} />
          </View>

          <PressableScale
            style={styles.settingsBtn}
            onPress={() => router.push('/profile/settings')}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </PressableScale>

          <Animated.View entering={ZoomIn.delay(80).springify().damping(19).mass(1).stiffness(100)}>
            <View style={styles.avatarRing}>
              <PlaceholderImage label={displayName} style={styles.avatar} round />
            </View>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(180).springify().damping(31).mass(1).stiffness(100)} style={styles.profileInfo}>
            <Typography variant="h3" color={colors.text} style={styles.profileName}>
              {displayName}
            </Typography>
            <Typography variant="body" color={colors.textSecondary}>
              {displayEmail}
            </Typography>
            {isPartner && (
              <View style={styles.partnerBadge}>
                <Ionicons name="leaf" size={13} color={colors.primaryDark} />
                <Typography variant="caption" color={colors.primaryDark} weight="bold">
                  MGC Partner
                </Typography>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInUp.delay(220).springify().damping(31).mass(1).stiffness(100)}
          style={styles.statsRow}
        >
          {[
            { label: 'Orders', value: orderCount === null ? '–' : String(orderCount), icon: 'bag-handle-outline' as const },
            { label: 'Saved Addresses', value: addressCount === null ? '–' : String(addressCount), icon: 'location-outline' as const },
            // BUG-15: 'Reviews' tile removed — no reviews feature exists (was hardcoded 0).
          ].map((stat, index, arr) => (
            <React.Fragment key={index}>
              <View style={styles.statItem}>
                <View style={styles.statIconBg}>
                  <Ionicons name={stat.icon} size={20} color={colors.primary} />
                </View>
                <View>
                  <Typography variant="h4" color={colors.text} weight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    {stat.label}
                  </Typography>
                </View>
              </View>
              {index < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => {
          return (
            <View key={sectionIndex} style={styles.menuSection}>
              <Animated.View
                entering={FadeInUp.delay(itemDelay).springify().damping(31).mass(1).stiffness(100)}
              >
                <Typography
                  variant="bodySmall"
                  color={colors.textTertiary}
                  uppercase
                  weight="medium"
                  style={styles.menuTitle}
                >
                  {section.title}
                </Typography>
              </Animated.View>
              <Card padding="none" style={styles.menuCard}>
                {section.items.map((item, itemIndex) => {
                  const d = itemDelay + (itemIndex + 1) * 60;
                  return (
                    <MenuRow
                      key={itemIndex}
                      item={item}
                      isLast={itemIndex === section.items.length - 1}
                      delay={d}
                      tone={itemIndex % 2 === 0 ? 'green' : 'peach'}
                    />
                  );
                })}
              </Card>
              {(() => { itemDelay += (section.items.length + 1) * 60; return null; })()}
            </View>
          );
        })}

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(640).springify().damping(31).mass(1).stiffness(100)} style={styles.logoutWrap}>
          <PressableScale style={styles.logoutButton} onPress={handleSignOut} haptic={false} accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Typography variant="body" color={colors.error} weight="semibold" style={styles.logoutLabel}>
              Sign Out
            </Typography>
          </PressableScale>
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
  scrollContent: {
    paddingBottom: spacing['8xl'],
  },
  profileHeader: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.accentSurface,
  },
  headerFlourishTop: {
    position: 'absolute',
    top: -10,
    right: -16,
    width: 140,
    height: 140,
  },
  flourishLeafBack: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 0.45,
    transform: [{ rotate: '20deg' }],
  },
  flourishLeafFront: {
    position: 'absolute',
    top: 46,
    right: 46,
    opacity: 0.5,
    transform: [{ rotate: '-14deg' }],
  },
  headerFlourishBottom: {
    position: 'absolute',
    bottom: -24,
    left: -20,
    opacity: 0.5,
    transform: [{ rotate: '-28deg' }],
  },
  settingsBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.surface,
    padding: 3,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  menuTitle: {
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
    letterSpacing: 1,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  menuIconBg: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },
  menuItemSubtitle: {
    marginTop: 2,
  },
  logoutWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.errorLight,
  },
  logoutLabel: {
    marginLeft: spacing.sm,
  },
});
