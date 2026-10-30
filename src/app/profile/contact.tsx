import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';

const contactMethods = [
  {
    icon: 'mail-outline' as const,
    label: 'Email Us',
    value: 'theminigreenscompany@gmail.com',
    action: () => Linking.openURL('mailto:theminigreenscompany@gmail.com'),
    hint: 'Replies within 24 hours',
  },
  {
    icon: 'call-outline' as const,
    label: 'Call Us',
    value: '+91 99803 44273',
    action: () => Linking.openURL('tel:+919980344273'),
    hint: 'Mon–Sat, 9am–6pm IST',
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    label: 'WhatsApp',
    value: '+91 99803 44273',
    action: () => Linking.openURL('https://wa.me/919980344273'),
    hint: 'Fastest response',
  },
  {
    icon: 'logo-instagram' as const,
    label: 'Instagram',
    value: '@minigreenscompany',
    action: () => Linking.openURL('https://www.instagram.com/minigreenscompany'),
    hint: 'Follow for fresh updates',
  },
];

function ContactRow({
  method,
  index,
  isLast,
}: {
  method: (typeof contactMethods)[0];
  index: number;
  isLast: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInUp.delay(120 + index * 70).springify().damping(31).mass(1).stiffness(100)}
      style={animStyle}
    >
      <Pressable
        style={[styles.contactRow, !isLast && styles.contactRowBorder]}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          method.action();
        }}
      >
        <View style={styles.iconBg}>
          <Ionicons name={method.icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.contactInfo}>
          <Typography variant="bodySmall" weight="semibold" color={colors.text}>
            {method.label}
          </Typography>
          <Typography variant="caption" color={colors.primary}>
            {method.value}
          </Typography>
          <Typography variant="caption" color={colors.textTertiary}>
            {method.hint}
          </Typography>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

export default function ContactScreen() {
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
        <Typography variant="body" weight="semibold">Contact Us</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.hero}>
          <View style={styles.heroIconBg}>
            <Ionicons name="headset-outline" size={36} color={colors.primary} />
          </View>
          <Typography variant="h4" color={colors.primaryDark} style={styles.heroTitle}>
            We're here to help
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.heroSubtitle}>
            Reach out through any of the channels below. Our team responds promptly.
          </Typography>
        </Animated.View>

        <View style={styles.methodsCard}>
          {contactMethods.map((method, i) => (
            <ContactRow
              key={i}
              method={method}
              index={i}
              isLast={i === contactMethods.length - 1}
            />
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(400).springify().damping(31).mass(1).stiffness(100)} style={styles.officeCard}>
          <View style={styles.officeHeader}>
            <Ionicons name="business-outline" size={20} color={colors.primary} />
            <Typography variant="bodySmall" weight="semibold" style={{ marginLeft: spacing.sm }}>
              Our Farm &amp; Office
            </Typography>
          </View>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.officeAddress}>
            Green Farm Road{'\n'}
            Wayanad — 673121{'\n'}
            Kerala, India
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
  hero: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  heroIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  methodsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  officeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  officeAddress: {
    lineHeight: 24,
    paddingLeft: 20 + spacing.sm,
  },
});
