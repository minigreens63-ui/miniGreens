import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';

const sections = [
  {
    icon: 'time-outline' as const,
    title: 'Tell Us Within 24 Hours',
    body: 'Greens are at their best the day they arrive, so we need to hear about problems quickly. Message or call us within a day of delivery with your order number and a photo if you have one. We don’t need the produce back — please compost it rather than returning it to us.',
  },
  {
    icon: 'gift-outline' as const,
    title: "What You'll Get",
    body: 'You choose: a replacement on your next delivery run, a credit applied to your account, or a full refund to your original payment method. Refunds are processed within three to five working days. For subscription boxes, we can also credit the affected week and push your billing date forward.',
  },
  {
    icon: 'close-circle-outline' as const,
    title: "What Isn't Covered",
    body: 'We can’t cover produce left outside in the heat after a successful delivery, or boxes reported more than seven days after arrival. If nobody was home and the delivery had to be aborted, get in touch and we’ll usually reschedule at no cost the first time.',
  },
  {
    icon: 'ban-outline' as const,
    title: 'Cancelling An Order',
    body: 'Pre-orders can be cancelled free of charge until the evening before your delivery slot, because that’s when we decide what to cut. Subscriptions can be skipped or cancelled at any time from your account, with no notice period and no cancellation fee.',
  },
];

export default function ReturnsScreen() {
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
        <Typography variant="body" weight="semibold">Returns & Refunds</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.intro}>
          <Typography variant="h4" color={colors.primaryDark}>If It Isn't Right, We Make It Right</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.introBody}>
            Fresh produce can't be restocked, so we don't ask you to send anything back. If a box
            disappoints, tell us and we'll replace or refund it.
          </Typography>
        </Animated.View>

        {sections.map((section, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(100 + i * 60).springify().damping(31).mass(1).stiffness(100)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon} size={18} color={colors.primary} />
              </View>
              <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionTitle}>
                {section.title}
              </Typography>
            </View>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.sectionBody}>
              {section.body}
            </Typography>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.delay(100 + sections.length * 60).springify().damping(31).mass(1).stiffness(100)} style={styles.contact}>
          <Typography variant="caption" color={colors.textTertiary} style={{ textAlign: 'center' }}>
            Questions? Contact us at{' '}
            <Typography variant="caption" color={colors.primary}>theminigreenscompany@gmail.com</Typography>
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
  intro: {
    marginBottom: spacing['2xl'],
  },
  introBody: {
    marginTop: spacing.md,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionBody: {
    lineHeight: 22,
    paddingLeft: 34 + spacing.md,
  },
  contact: {
    marginTop: spacing.xl,
  },
});
