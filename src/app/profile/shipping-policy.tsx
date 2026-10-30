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

const SLOTS = ['08:00 – 10:00', '10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00'];

const sections = [
  {
    icon: 'calendar-outline' as const,
    title: 'Delivery Slots',
    body: `Choose one of four windows when you place an order (${SLOTS.join(', ')}). We text you a narrower estimate on the morning of delivery. We deliver Monday to Saturday — orders placed after 18:00 are cut for the following day at the earliest.`,
  },
  {
    icon: 'cash-outline' as const,
    title: 'Charges',
    body: 'Delivery is free on orders above ₹499 and on every subscription plan. Below that, a flat fee applies within the city limits. We currently deliver within a 25 km radius of the farm — if you’re just outside it, message us.',
  },
  {
    icon: 'cube-outline' as const,
    title: 'Packaging',
    body: 'Greens travel in ventilated punnets inside an insulated crate with a chilled gel pack. Everything except the gel pack is home compostable. Leave the crate out on your next delivery day and we’ll take it back for reuse.',
  },
  {
    icon: 'home-outline' as const,
    title: "If You're Not Home",
    body: 'Tell us a safe shaded spot in your delivery notes and we’ll leave the crate there. Without a note, our driver will call, wait five minutes, and then bring it back to the farm. A failed delivery can be rescheduled once at no cost.',
  },
];

export default function ShippingPolicyScreen() {
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
        <Typography variant="body" weight="semibold">Shipping Policy</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.intro}>
          <Typography variant="h4" color={colors.primaryDark}>How Your Greens Get To You</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.introBody}>
            We deliver with our own vans across the city, six days a week. Nothing is handed to a
            courier, because nothing survives a courier.
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
