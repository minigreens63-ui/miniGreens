import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, FlatList, Pressable, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../theme';
import { Typography } from '../components/ui/Typography';
import { Logo } from '../components/Logo';
import { useAppStore } from '../store/useAppStore';
import { onboardingSlides, OnboardingFeature } from '../mock';

// Slightly darker green than the theme chip colour so the dark-green product
// photography on each slide melts into the canvas.
const SLIDE_BG = '#2f3d20';

// ─── Brand lockup ─────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <View style={styles.brand}>
      <Logo width={132} />
    </View>
  );
}

// ─── Feature list (rows) ──────────────────────────────────────────────────────

function FeatureRows({ features }: { features: OnboardingFeature[] }) {
  const hasDescriptions = features.some((f) => !!f.description);
  return (
    <View style={styles.rows}>
      {features.map((f, i) => (
        <View key={f.title} style={[styles.row, hasDescriptions && i > 0 && styles.rowDivider]}>
          <View style={styles.rowIcon}>
            <Ionicons name={f.icon as any} size={20} color={colors.secondary} />
          </View>
          <View style={styles.rowBody}>
            <Typography variant="h4" color={colors.textInverse} style={styles.rowTitle}>
              {f.title}
            </Typography>
            {f.description ? (
              <Typography variant="bodySmall" color="rgba(255,255,255,0.6)">
                {f.description}
              </Typography>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Feature list (cards) ─────────────────────────────────────────────────────

function FeatureCards({ features }: { features: OnboardingFeature[] }) {
  return (
    <View style={styles.cards}>
      {features.map((f) => (
        <View key={f.title} style={styles.card}>
          <Ionicons name={f.icon as any} size={26} color={colors.secondary} />
          <Typography
            variant="bodySmall"
            color={colors.textInverse}
            align="center"
            weight="bold"
            style={styles.cardTitle}
          >
            {f.title}
          </Typography>
        </View>
      ))}
    </View>
  );
}

// ─── Animated Dot ─────────────────────────────────────────────────────────────

function SliderDot({ isActive }: { isActive: boolean }) {
  const scaleX = useSharedValue(isActive ? 1 : 0.5);
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    scaleX.value = withSpring(isActive ? 1 : 0.5, { damping: 24, stiffness: 160, mass: 1 });
    opacity.value = withSpring(isActive ? 1 : 0.4, { damping: 31, stiffness: 200, mass: 1 });
  }, [isActive]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, isActive && styles.dotActive, dotStyle]} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const FOOTER_HEIGHT = 176;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete();
    router.replace('/auth/login');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const isLastSlide = currentIndex === onboardingSlides.length - 1;
  const topPad = insets.top + spacing.md;
  const bottomPad = insets.bottom + spacing['2xl'];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.slide,
              {
                width,
                height,
                paddingTop: topPad,
                paddingBottom: bottomPad + FOOTER_HEIGHT,
              },
            ]}
          >
            <View
              style={[
                styles.hero,
                {
                  top: topPad + height * 0.02,
                  right: -width * 0.08,
                  width: width * 0.74,
                  height: height * 0.44,
                  pointerEvents: 'none',
                },
              ]}
            >
              <Image source={item.image} style={styles.heroImage} contentFit="cover" />
              {/* Blend the photo's straight edges into the dark-green canvas */}
              <LinearGradient
                colors={[SLIDE_BG, 'rgba(10,36,22,0.05)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.6, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,36,22,0.4)', SLIDE_BG]}
                start={{ x: 0.5, y: 0.45 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <BrandMark />

            <View style={{ maxWidth: width * 0.66 }}>
              <Typography variant="h1" color={colors.textInverse}>
                {item.title}
                {'  '}
                <Ionicons name="leaf" size={26} color={colors.secondary} />
              </Typography>
            </View>

            <Typography
              variant="body"
              color="rgba(255,255,255,0.72)"
              style={[styles.subtitle, { maxWidth: width * 0.6 }]}
            >
              {item.subtitle}
            </Typography>

            <View style={styles.spacer} />

            {item.featureStyle === 'cards' ? (
              <FeatureCards features={item.features} />
            ) : (
              <FeatureRows features={item.features} />
            )}
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <View style={styles.pagination}>
          {onboardingSlides.map((_, index) => (
            <SliderDot key={index} isActive={index === currentIndex} />
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Typography variant="body" color="#06130D" weight="bold" style={styles.ctaLabel}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Typography>
          </Pressable>
          {!isLastSlide && (
            <Pressable onPress={handleGetStarted} style={styles.skipButton} hitSlop={12}>
              <Typography variant="body" color={colors.secondary} weight="bold">
                Skip
              </Typography>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SLIDE_BG,
  },
  slide: {
    paddingHorizontal: spacing['2xl'],
  },
  hero: {
    position: 'absolute',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    marginBottom: spacing['4xl'],
  },
  subtitle: {
    marginTop: spacing.lg,
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
    minHeight: spacing['2xl'],
  },
  // ── rows ──
  rows: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(150,255,31,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    marginBottom: 2,
  },
  // ── cards ──
  cards: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardTitle: {
    marginTop: spacing.md,
  },
  // ── footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    backgroundColor: SLIDE_BG,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.secondary,
    width: 24,
  },
  buttons: {
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    minHeight: 58,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  skipButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
