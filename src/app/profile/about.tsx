import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { BRAND_CLAIM_SHORT } from '../../theme/brand';
import { Typography } from '../../components/ui/Typography';

const values = [
  {
    icon: 'leaf-outline' as const,
    title: 'Farm Fresh',
    body: 'Harvested within 24 hours of delivery. What you receive was alive on our farm yesterday.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Certified Organic',
    body: 'We grow using certified organic seeds with zero pesticides or synthetic fertilizers.',
  },
  {
    icon: 'heart-outline' as const,
    title: 'Nutrition Dense',
    body: 'Microgreens contain up to 40× more vitamins than their mature counterparts.',
  },
  {
    icon: 'bicycle-outline' as const,
    title: 'Zero Plastic',
    body: 'All our packaging is 100% biodegradable. We deliver in compostable trays and paper bags.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Community First',
    body: 'We partner with local growers and donate 2% of every sale to urban farming initiatives.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Always Innovating',
    body: 'From rare varieties to AI-powered personalization, we push what is possible with greens.',
  },
];

const stats = [
  { value: '12+', label: 'Varieties grown' },
  { value: '47K', label: 'Happy customers' },
  { value: '3.2T', label: 'Greens delivered' },
  { value: '100%', label: 'Organic certified' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

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
        <Typography variant="body" weight="semibold">About</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)}>
          <LinearGradient
            colors={[colors.primaryDark, '#3c4f28']}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View entering={ZoomIn.delay(120).springify().damping(19).mass(1).stiffness(100)} style={styles.heroIcon}>
              <Ionicons name="leaf" size={40} color={colors.secondary} />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(180).springify().damping(31).mass(1).stiffness(100)}>
              <Typography variant="h3" color={colors.textInverse} style={styles.heroTitle}>
                MiniGreens
              </Typography>
              <Typography variant="bodySmall" color="rgba(255,255,255,0.72)" style={styles.heroTagline}>
                {BRAND_CLAIM_SHORT}. Growing nutrition, delivering freshness.
              </Typography>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Story */}
        <Animated.View entering={FadeInUp.delay(220).springify().damping(31).mass(1).stiffness(100)} style={styles.storySection}>
          <Typography variant="body" weight="semibold" style={styles.sectionTitle}>Our Story</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.storyText}>
            MiniGreens was born in 2022 from a Bengaluru rooftop. Our founders, frustrated by the nutrient-poor produce
            arriving in cities from distant farms, began growing microgreens in unused trays. Word spread. Neighbours
            started ordering. What began as a passion became a mission — to put the most nutritious food on every table,
            grown as close to home as possible.
          </Typography>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(280).springify().damping(31).mass(1).stiffness(100)} style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(300 + i * 60).springify().damping(19).mass(1).stiffness(100)}
              style={styles.statCard}
            >
              <Typography variant="h3" color={colors.primaryDark} weight="bold">
                {stat.value}
              </Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {stat.label}
              </Typography>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Values */}
        <Animated.View entering={FadeInUp.delay(400).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="body" weight="semibold" style={styles.sectionTitle}>Our Values</Typography>
        </Animated.View>
        {values.map((value, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(440 + i * 60).springify().damping(31).mass(1).stiffness(100)}
            style={styles.valueCard}
          >
            <View style={styles.valueIcon}>
              <Ionicons name={value.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.valueContent}>
              <Typography variant="bodySmall" weight="semibold" color={colors.text}>
                {value.title}
              </Typography>
              <Typography variant="caption" color={colors.textSecondary} style={styles.valueBody}>
                {value.body}
              </Typography>
            </View>
          </Animated.View>
        ))}
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
    paddingBottom: spacing['8xl'],
  },
  hero: {
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(150,255,31,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroTagline: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  storySection: {
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  storyText: {
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '46%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  valueContent: {
    flex: 1,
  },
  valueBody: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
