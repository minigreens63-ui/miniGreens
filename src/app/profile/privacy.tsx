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
    icon: 'shield-checkmark-outline' as const,
    title: 'Information We Collect',
    body: 'We collect information you provide directly to us, such as your name, email address, phone number, and delivery address when you create an account or place an order. We also collect device information and usage data to improve our service.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'How We Use Your Information',
    body: 'We use the information we collect to process orders, send delivery updates, personalize your experience, and communicate with you about promotions and new products. We will never sell your personal data to third parties.',
  },
  {
    icon: 'share-outline' as const,
    title: 'Information Sharing',
    body: 'We may share your information with delivery partners to fulfill your orders. All partners are bound by data protection agreements and may only use your data for the purpose of delivery.',
  },
  {
    icon: 'key-outline' as const,
    title: 'Data Security',
    body: 'We implement industry-standard security measures including SSL encryption, secure servers, and regular audits to protect your personal information from unauthorized access or disclosure.',
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Your Rights',
    body: 'You have the right to access, correct, or delete your personal data at any time. You may also opt out of marketing communications. Contact us at theminigreenscompany@gmail.com to exercise these rights.',
  },
  {
    icon: 'refresh-outline' as const,
    title: 'Policy Updates',
    body: 'We may update this privacy policy from time to time. We will notify you of significant changes via email or a notice in the app. Continued use of our service after changes constitutes your acceptance.',
  },
];

export default function PrivacyScreen() {
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
        <Typography variant="body" weight="semibold">Privacy Policy</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.intro}>
          <Typography variant="h4" color={colors.primaryDark}>Privacy Policy</Typography>
          <Typography variant="caption" color={colors.textTertiary} style={styles.effectiveDate}>
            Effective: January 1, 2025
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.introBody}>
            Your privacy matters to us. This policy explains how MiniGreens collects, uses, and protects your information.
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
