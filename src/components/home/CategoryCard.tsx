import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../ui/Typography';
import { Category } from '../../types';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../ui/PlaceholderImage';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  index?: number;
  active?: boolean;
  /** `circle` = round thumbnail + label underneath (reference home). `tile` = legacy rect. */
  variant?: 'circle' | 'tile';
  /** Local asset (require id) to use instead of `category.image`. */
  imageOverride?: number | null;
}

export function CategoryCard({
  category,
  onPress,
  index = 0,
  active = false,
  variant = 'circle',
  imageOverride = null,
}: CategoryCardProps) {
  const imgSource = imageOverride != null ? imageOverride : category.image ? resolveImageSource(category.image) : null;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pressIn = () => { scale.value = withSpring(0.94, { damping: 31, stiffness: 220, mass: 1 }); };
  const pressOut = () => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); };
  const handlePress = () => { Haptics.selectionAsync(); onPress(); };

  if (variant === 'circle') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 60).springify().damping(31).mass(1).stiffness(100)}
        style={[styles.cWrap, animStyle]}
      >
        <Pressable onPress={handlePress} onPressIn={pressIn} onPressOut={pressOut} style={styles.cPress}>
          <View style={[styles.cCircle, active && styles.cCircleActive]}>
            {imgSource ? (
              <Image source={imgSource} style={styles.cImage} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <PlaceholderImage label={category.name} style={styles.cImage} round />
            )}
          </View>
          <Typography
            variant="caption"
            weight={active ? 'bold' : 'medium'}
            color={active ? colors.textPrimary : colors.textSecondary}
            style={styles.cLabel}
            numberOfLines={1}
          >
            {category.name}
          </Typography>
          <View style={[styles.cUnderline, active && styles.cUnderlineActive]} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 70).springify().damping(31).mass(1).stiffness(100)}
      style={[styles.wrap, animStyle]}
    >
      <Pressable onPress={handlePress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.card, active && styles.cardActive]}>
        {category.image ? (
          <Image
            source={resolveImageSource(category.image)}
            style={styles.image}
            contentFit="cover" cachePolicy="memory-disk"
          />
        ) : (
          <PlaceholderImage label={category.name} style={styles.image} />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
          locations={[0, 0.46, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.iconChip}>
          <Ionicons name={(category.icon || 'leaf') as any} size={13} color={active ? colors.primary : colors.textTertiary} />
        </View>
        <Typography variant="caption" weight="semibold" color={colors.textPrimary} style={styles.label} numberOfLines={1}>
          {category.name}
        </Typography>
      </Pressable>
      {active && <View style={styles.underlineActive} />}
    </Animated.View>
  );
}

const ROW_W = Dimensions.get('window').width;
const GAP = spacing.xs + 2;
const CARD_W = Math.floor((ROW_W - spacing.lg - GAP * 4) / 4);
const CARD_H = Math.round(CARD_W * 0.9);
const CIRCLE = 66;

const styles = StyleSheet.create({
  // ── circle variant ──
  cWrap: {
    marginRight: spacing.lg,
    alignItems: 'center',
  },
  cPress: {
    alignItems: 'center',
    width: CIRCLE + 14,
  },
  cCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cCircleActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  cImage: {
    width: '100%',
    height: '100%',
  },
  cLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  cUnderline: {
    marginTop: 5,
    height: 3,
    width: 18,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  cUnderlineActive: {
    backgroundColor: colors.accent,
  },

  // ── tile variant (legacy) ──
  wrap: {
    marginRight: GAP,
    alignItems: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 3,
  },
  iconChip: {
    position: 'absolute',
    top: spacing.xs + 2,
    left: spacing.xs + 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(30,45,25,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  image: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: CARD_H,
    width: CARD_W * 0.62,
  },
  label: {
    position: 'absolute',
    left: spacing.xs + 2,
    bottom: spacing.xs + 2,
    right: spacing.xs,
    zIndex: 2,
    fontSize: 11,
    lineHeight: 14,
  },
  underlineActive: {
    marginTop: 6,
    height: 3,
    width: 22,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
