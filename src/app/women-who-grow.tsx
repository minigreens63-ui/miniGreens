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
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

const PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'bulb-outline',
    title: 'An opportunity',
    body: 'Opportunity should not depend on where you live, your age, or the circumstances of your life. Microgreens grow at home, in a small space, with a simple setup.',
  },
  {
    icon: 'layers-outline',
    title: 'A platform',
    body: 'We handle the selling, the orders, and the delivery. You focus on growing. Partner women keep their earnings, because there is no platform fee.',
  },
  {
    icon: 'trending-up-outline',
    title: 'A business of your own',
    body: 'Start small, grow at your own pace, and build something that is yours. Whether it is a side income or a full business, the choice is yours.',
  },
];

const STEPS = [
  { n: '1', title: 'Get your starter kit', body: 'A microgreens starter kit with seeds and everything you need to begin at home.' },
  { n: '2', title: 'Learn with training', body: 'Hands-on training on how to grow microgreens well, and how to sell them with confidence.' },
  { n: '3', title: 'Grow and sell', body: 'Grow in your own space, and sell with MGC. We handle the orders and delivery.' },
  { n: '4', title: 'Earn for yourself', body: 'Keep what you earn. You build an income and a business that belongs to you.' },
];

const IMPACT = [
  'Better education for children, when a woman earns.',
  'Greater financial security for the whole family.',
  'More confidence in her own abilities.',
  'A stronger future for the next generation.',
];

export default function WomenWhoGrowScreen() {
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
        <Typography variant="body" weight="semibold">Women Who Grow</Typography>
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
              <Ionicons name="people" size={36} color={colors.secondary} />
            </Animated.View>
            <Typography variant="caption" color={colors.secondary} weight="bold" style={styles.heroEyebrow}>
              WOMEN ENTREPRENEURSHIP
            </Typography>
            <Typography variant="h3" color={colors.textInverse} style={styles.heroTitle}>
              Women Who Grow, Families That Rise
            </Typography>
            <Typography variant="bodySmall" color="rgba(255,255,255,0.78)" style={styles.heroTagline}>
              In many homes, a woman is the one who holds everything together. We believe she
              should also have the chance to build something for herself.
            </Typography>
          </LinearGradient>
        </Animated.View>

        {/* Pillars */}
        <Animated.View entering={FadeInUp.delay(180).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <Typography variant="body" weight="semibold" style={styles.sectionTitle}>What We Believe</Typography>
          {PILLARS.map((p, i) => (
            <Animated.View
              key={p.title}
              entering={FadeInUp.delay(220 + i * 60).springify().damping(31).mass(1).stiffness(100)}
              style={styles.pillarCard}
            >
              <View style={styles.pillarIcon}>
                <Ionicons name={p.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodySmall" weight="semibold" color={colors.text}>{p.title}</Typography>
                <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 4, lineHeight: 18 }}>
                  {p.body}
                </Typography>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Journey */}
        <Animated.View entering={FadeInUp.delay(420).springify().damping(31).mass(1).stiffness(100)} style={styles.journeyCard}>
          <Typography variant="caption" color="rgba(255,255,255,0.65)" weight="bold" style={{ letterSpacing: 1 }}>
            YOUR PATH
          </Typography>
          <Typography variant="h4" color={colors.textInverse} style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            From a seed to your own income
          </Typography>
          {STEPS.map((s) => (
            <View key={s.n} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Typography variant="bodySmall" weight="bold" color={colors.textInverse}>{s.n}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodySmall" weight="semibold" color={colors.textInverse}>{s.title}</Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2, lineHeight: 17 }}>
                  {s.body}
                </Typography>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Impact */}
        <Animated.View entering={FadeInUp.delay(500).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <Typography variant="body" weight="semibold" style={styles.sectionTitle}>
            When a Woman Earns, a Family Rises
          </Typography>
          {IMPACT.map((item) => (
            <View key={item} style={styles.impactRow}>
              <View style={styles.impactDot} />
              <Typography variant="bodySmall" color={colors.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                {item}
              </Typography>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(580).springify().damping(31).mass(1).stiffness(100)} style={styles.ctaCard}>
          <Typography variant="caption" color={colors.primary} weight="bold" style={{ letterSpacing: 1 }}>SUMAM</Typography>
          <Typography variant="h4" color={colors.text} style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            Our women entrepreneurship program
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 }}>
            Sumam is how we help create new women entrepreneurs, from growing at home to selling
            with us. Reach out and our team will get in touch.
          </Typography>
          <Button
            title="Get in Touch"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/contact' as any);
            }}
            style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          />
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
    paddingBottom: spacing['8xl'],
  },
  hero: {
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(150,255,31,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroTagline: {
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  section: {
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  pillarCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  impactDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  ctaCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
});
