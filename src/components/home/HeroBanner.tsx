import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { resolveImageSource } from '../../utils/placeholders';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, layout } from '../../theme';
import { Typography } from '../ui/Typography';
import { Banner } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroBannerProps {
  banner: Banner;
  onPress: () => void;
}

export function HeroBanner({ banner, onPress }: HeroBannerProps) {
  const scale = useSharedValue(1);
  const contentY = useSharedValue(20);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentY.value = withDelay(200, withSpring(0, { damping: 37, stiffness: 180, mass: 1 }));
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const pressScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, pressScale]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 32, stiffness: 300, mass: 1 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 30, stiffness: 250, mass: 1 }); }}
        style={StyleSheet.absoluteFill}
      >
        <Image source={resolveImageSource(banner.image)} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />

        {/* Forest-tinted gradient for brand identity */}
        <LinearGradient
          colors={['transparent', 'rgba(10,36,22,0.92)']}
          locations={[0.3, 1]}
          style={styles.gradient}
        />

        <Animated.View style={[styles.content, contentStyle]}>
          {/* Only show tag + text when the banner has its own copy */}
          {!!banner.title && (
            <>
              <View style={styles.tag}>
                <View style={styles.tagDot} />
                <Typography variant="caption" color={colors.textInverse} weight="bold" style={styles.tagText}>
                  FEATURED
                </Typography>
              </View>

              <Typography variant="h2" color={colors.textInverse} style={styles.title} numberOfLines={2}>
                {banner.title}
              </Typography>

              <Typography variant="bodySmall" color="rgba(255,255,255,0.75)" style={styles.subtitle} numberOfLines={2}>
                {banner.subtitle}
              </Typography>
            </>
          )}

          {/* Pill CTA always visible */}
          <View style={styles.cta}>
            <Typography variant="bodySmall" color="#06130D" weight="bold">
              {banner.cta}
            </Typography>
            <Ionicons name="arrow-forward" size={15} color="#06130D" style={{ marginLeft: 6 }} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.heroHeight,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing['2xl'],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: spacing.sm,
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    marginBottom: spacing.sm,
    width: '85%',
  },
  subtitle: {
    marginBottom: spacing.xl,
    width: '78%',
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
});
