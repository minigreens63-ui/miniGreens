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
    title: '1. Acceptance of Terms',
    body: 'By downloading, accessing, or using the MiniGreens application or website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our service.',
  },
  {
    title: '2. Account Registration',
    body: 'You must create an account to place orders. You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.',
  },
  {
    title: '3. Orders & Payment',
    body: 'All orders are subject to product availability. We reserve the right to refuse or cancel any order. Payment must be made at the time of order placement. Prices are in Indian Rupees and include applicable taxes.',
  },
  {
    title: '4. Delivery Policy',
    body: 'We deliver within serviceable areas in Bengaluru. Delivery times are estimates and may vary. Risk of loss or damage passes to you upon delivery. We are not responsible for delays caused by factors outside our control.',
  },
  {
    title: '5. Cancellation & Refunds',
    body: 'Orders may be cancelled within 2 hours of placement. Refunds for cancelled orders are processed within 5–7 business days. For quality complaints, please contact us within 24 hours of delivery with photographs.',
  },
  {
    title: '6. Subscriptions',
    body: 'Subscription plans renew automatically unless cancelled. You may pause or cancel your subscription at any time from the app. Cancellations take effect at the end of the current billing period.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All content on the MiniGreens platform, including text, graphics, logos, and software, is the property of MiniGreens and protected by applicable intellectual property laws.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'MiniGreens shall not be liable for any indirect, incidental, or consequential damages arising from your use of our service. Our maximum liability shall not exceed the amount paid for the specific order in dispute.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We reserve the right to modify these terms at any time. Continued use of our service after changes constitutes acceptance. We will provide notice of material changes via email or in-app notification.',
  },
];

export default function TermsScreen() {
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
        <Typography variant="body" weight="semibold">Terms of Service</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.intro}>
          <Typography variant="h4" color={colors.primaryDark}>Terms of Service</Typography>
          <Typography variant="caption" color={colors.textTertiary} style={styles.effectiveDate}>
            Last updated: January 1, 2025
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.introBody}>
            Please read these terms carefully before using the MiniGreens app or services.
          </Typography>
        </Animated.View>

        {sections.map((section, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(80 + i * 50).springify().damping(31).mass(1).stiffness(100)}
            style={styles.section}
          >
            <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionTitle}>
              {section.title}
            </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.sectionBody}>
              {section.body}
            </Typography>
          </Animated.View>
        ))}

        <Animated.View
          entering={FadeInUp.delay(80 + sections.length * 50).springify().damping(31).mass(1).stiffness(100)}
          style={styles.contact}
        >
          <Typography variant="caption" color={colors.textTertiary} style={{ textAlign: 'center' }}>
            Questions about these terms?{'\n'}
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
  effectiveDate: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  introBody: {
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionBody: {
    lineHeight: 22,
  },
  contact: {
    marginTop: spacing.xl,
  },
});
