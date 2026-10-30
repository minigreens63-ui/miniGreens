import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
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
import { BRAND_CLAIM } from '../../theme/brand';

const faqs = [
  {
    q: 'Who is MiniGreens?',
    a: `MiniGreens is ${BRAND_CLAIM}. We grow microgreens and microgreen teas in India and deliver them fresh to your door.`,
  },
  {
    q: 'How fresh are the microgreens?',
    a: 'Our microgreens are harvested within 24 hours of delivery. We grow them in our climate-controlled facility and cut them fresh for every order.',
  },
  {
    q: 'How long do microgreens last?',
    a: 'When stored properly in the refrigerator, our microgreens typically last 7–10 days. Keep them in their original packaging or an airtight container.',
  },
  {
    q: 'What is the minimum order?',
    a: 'There is no minimum order. Order as much or as little as you need. Free delivery is available on orders above ₹499.',
  },
  {
    q: 'Can I customize my subscription?',
    a: 'Yes! You can choose the frequency (weekly, bi-weekly, or monthly), the mix of greens, and the quantity. You can pause or cancel anytime.',
  },
  {
    q: 'Are your products organic?',
    a: 'We use certified organic seeds and growing media. Our facility is pesticide-free, and we never use synthetic fertilizers.',
  },
  {
    q: 'How do I store microgreens?',
    a: 'Store them unwashed in the refrigerator. Only wash what you plan to use. Keep them away from the coldest part of the fridge to avoid frost damage.',
  },
  {
    q: 'Do you offer corporate or bulk orders?',
    a: 'Absolutely! We supply restaurants, cafes, and offices. Reach out via the Contact Us page or email us at theminigreenscompany@gmail.com for bulk pricing.',
  },
];

function FAQItem({ item, index }: { item: (typeof faqs)[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
  }));

  const toggle = () => {
    Haptics.selectionAsync();
    const next = !open;
    setOpen(next);
    rotation.value = withSpring(next ? 45 : 0, { damping: 25, stiffness: 180, mass: 1 });
    bodyOpacity.value = withTiming(next ? 1 : 0, { duration: 220 });
  };

  return (
    <Animated.View entering={FadeInUp.delay(80 + index * 60).springify().damping(31).mass(1).stiffness(100)}>
      <Pressable style={styles.faqItem} onPress={toggle}>
        <View style={styles.faqRow}>
          <Typography variant="body" weight="semibold" color={colors.text} style={styles.faqQuestion}>
            {item.q}
          </Typography>
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Animated.View>
        </View>
        {open && (
          <Animated.View style={bodyStyle}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.faqAnswer}>
              {item.a}
            </Typography>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function FAQScreen() {
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
        <Typography variant="body" weight="semibold">FAQ</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.intro}>
          <Typography variant="h4" color={colors.primaryDark}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.introSubtitle}>
            Everything you need to know about MiniGreens.
          </Typography>
        </Animated.View>

        <View style={styles.faqList}>
          {faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </View>
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
  introSubtitle: {
    marginTop: spacing.sm,
  },
  faqList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    marginRight: spacing.md,
  },
  faqAnswer: {
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
