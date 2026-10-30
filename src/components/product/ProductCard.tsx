import React, { useState } from 'react';
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
import { Product } from '../../types';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../ui/PlaceholderImage';
import { useCartStore } from '../../store/useCartStore';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  variant?: 'default' | 'horizontal' | 'compact' | 'seasonal';
  index?: number;
  style?: object;
}

function useSpringPress(to = 0.96) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => { scale.value = withSpring(to, { damping: 31, stiffness: 220, mass: 1 }); };
  const onPressOut = () => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); };
  return { animStyle, onPressIn, onPressOut };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Hero "Best Sellers" card — image-led, one full card + a peek of the next.
// Widened from the old 152 so the product photography can actually breathe
// (the reference gets its richness from proportion, not a huge card).
// Two cards + a peek of the third — the reference Home Screen's proportion.
const FEATURE_CARD_W = Math.min(Math.round(SCREEN_WIDTH * 0.46), 210);


// ─── Inline cart stepper ─────────────────────────────────────────────────────

function CartStepper({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const cartItem = useCartStore((s) => s.items.find((i) => i.slug === slug));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const qty = cartItem?.quantity ?? 0;

  const inc = async () => {
    Haptics.selectionAsync();
    const ok = await useCartStore.getState().addItemBySlug(slug, 1);
    if (!ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const dec = () => {
    if (!cartItem) return;
    Haptics.selectionAsync();
    updateQuantity(cartItem.productId, qty - 1);
  };

  return (
    <View style={[styles.stepper, compact && styles.stepperCompact]}>
      <Pressable style={[styles.stepperBtn, compact && styles.stepperBtnCompact]} onPress={dec} hitSlop={8} disabled={qty === 0}>
        <Ionicons name="remove" size={compact ? 11 : 14} color={colors.primary} style={qty === 0 && styles.stepperDisabled} />
      </Pressable>
      <Typography
        variant="bodySmall"
        weight="bold"
        color={colors.accent}
        style={[styles.stepperQty, compact && styles.stepperQtyCompact]}
      >
        {qty}
      </Typography>
      <Pressable style={[styles.stepperBtn, compact && styles.stepperBtnCompact]} onPress={inc} hitSlop={8}>
        <Ionicons name="add" size={compact ? 11 : 14} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function ProductCard({ product, onPress, variant = 'default', index = 0, style }: ProductCardProps) {
  const { animStyle, onPressIn, onPressOut } = useSpringPress();
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorited((v) => !v);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // ─── Horizontal variant ───────────────────────────────────────────────────

  if (variant === 'horizontal') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 70).springify().damping(31).mass(1).stiffness(100)}
        style={[animStyle, style]}
      >
        <Pressable
          style={styles.horizontalCard}
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          {product.images[0] ? (
            <Image source={resolveImageSource(product.images[0])} style={styles.horizontalImage} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <PlaceholderImage label={product.name} style={styles.horizontalImage} />
          )}
          <View style={styles.horizontalContent}>
            <Typography variant="caption" color={colors.primary} weight="medium" uppercase>
              {product.unit}
            </Typography>
            <Typography variant="body" weight="bold" numberOfLines={1}>
              {product.name}
            </Typography>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={colors.secondary} />
              <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                {product.rating} ({product.reviewCount})
              </Typography>
            </View>
            <View style={styles.priceRow}>
              <Typography variant="h4" color={colors.accent} weight="bold">
                ₹{product.price.toFixed(0)}
              </Typography>
              {product.originalPrice && (
                <Typography variant="caption" color={colors.textTertiary} style={styles.originalPrice}>
                  ₹{product.originalPrice.toFixed(0)}
                </Typography>
              )}
              <View style={{ flex: 1 }} />
              <CartStepper slug={product.slug} compact />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── Seasonal variant — default card + "Add to cart" button ───────────────

  if (variant === 'seasonal') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 70).springify().damping(31).mass(1).stiffness(100)}
        style={[styles.seasonalCard, animStyle, style]}
      >
        <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.seasonalInner}>
          {/* Full-bleed image that fades out from ~50% down into the card */}
          {product.images[0] ? (
            <Image
              source={resolveImageSource(product.images[0])}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              contentFit="cover" cachePolicy="memory-disk"
            />
          ) : (
            <PlaceholderImage label={product.name} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
          )}
          <LinearGradient
            colors={['rgba(20,20,20,0)', 'rgba(20,20,20,0.6)', 'rgba(20,20,20,1)']}
            locations={[0.35, 0.58, 0.88]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {product.isBestSeller && (
            <View style={styles.bestsellerBadge}>
              <Ionicons name="star" size={9} color={colors.accent} />
              <Typography style={styles.badgeText} color={colors.accent}>BESTSELLER</Typography>
            </View>
          )}

          <Pressable style={styles.favouriteBtn} onPress={toggleFavorite} hitSlop={8}>
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={15}
              color={favorited ? colors.error : colors.textInverse}
            />
          </Pressable>

          <View style={styles.seasonalOverlayBody}>
            <View style={styles.unitBadgeInline}>
              <Typography style={styles.unitBadgeText} color="#06130D">{product.unit}</Typography>
            </View>
            <Typography variant="body" weight="bold" color={colors.textInverse} numberOfLines={1}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={2} style={styles.description}>
              {product.description}
            </Typography>

            <View style={styles.seasonalBottom}>
              <View>
                <Typography variant="caption" color="rgba(255,255,255,0.55)">Price</Typography>
                <Typography variant="h4" weight="bold" color={colors.accent}>
                  ₹{product.price.toFixed(0)}
                </Typography>
              </View>
              <Pressable
                style={styles.addToCartBtn}
                onPress={async () => {
                  Haptics.selectionAsync();
                  const ok = await useCartStore.getState().addItemBySlug(product.slug, 1);
                  if (!ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }}
              >
                <Typography weight="bold" color={colors.primary} style={styles.addToCartText}>Add To Cart</Typography>
                <Ionicons name="cart-outline" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── Compact variant ──────────────────────────────────────────────────────

  if (variant === 'compact') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 60).springify().damping(31).mass(1).stiffness(100)}
        style={[styles.compactCard, animStyle, style]}
      >
        <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
          {product.images[0] ? (
            <Image source={resolveImageSource(product.images[0])} style={styles.compactImage} />
          ) : (
            <PlaceholderImage label={product.name} style={styles.compactImage} />
          )}
          <View style={styles.compactContent}>
            <Typography variant="bodySmall" weight="semibold" numberOfLines={1}>
              {product.name}
            </Typography>
            <View style={styles.compactPriceRow}>
              <Typography variant="bodySmall" color={colors.accent} weight="bold">
                ₹{product.price.toFixed(0)}
              </Typography>
              <CartStepper slug={product.slug} compact />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── Default variant — compact card: image on top, details on the surface ──
  //     below (matches the reference Home Screen's Best Sellers cards).

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60).springify().damping(31).mass(1).stiffness(100)}
      style={[styles.card, animStyle, style]}
    >
      <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.cardInner}>
        <View style={styles.imageArea}>
          {product.images[0] ? (
            <Image
              source={resolveImageSource(product.images[0])}
              style={styles.image}
              contentFit="cover" cachePolicy="memory-disk"
            />
          ) : (
            <PlaceholderImage label={product.name} style={styles.image} />
          )}
          {/* Melt the photo into the card surface — no hard rectangle seam. */}
          <LinearGradient
            colors={['rgba(20,26,21,0)', 'rgba(20,26,21,0)', colors.surface]}
            locations={[0, 0.62, 1]}
            style={styles.imageFade}
            pointerEvents="none"
          />

          {product.isBestSeller && (
            <View style={styles.bestsellerBadge}>
              <Ionicons name="star" size={9} color={colors.accent} />
              <Typography style={styles.badgeText} color={colors.accent}>BESTSELLER</Typography>
            </View>
          )}

          <Pressable style={styles.favouriteBtn} onPress={toggleFavorite} hitSlop={8}>
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={15}
              color={favorited ? colors.error : colors.textInverse}
            />
          </Pressable>

          <View style={styles.unitBadgeOnImage}>
            <Typography style={styles.unitBadgeText} color="#06130D">
              {product.unit}
            </Typography>
          </View>
        </View>

        <View style={styles.content}>
          <Typography variant="bodySmall" weight="bold" color={colors.text} numberOfLines={1} style={styles.name}>
            {product.name}
          </Typography>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            numberOfLines={2}
            style={styles.cardDesc}
          >
            {product.description}
          </Typography>

          <View style={styles.bottomRow}>
            <Typography variant="bodySmall" weight="bold" color={colors.accent} style={styles.price}>
              ₹{product.price.toFixed(0)}
            </Typography>
            <CartStepper slug={product.slug} compact />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ── Default card — compact, image-on-top (reference proportions) ──────────
  card: {
    width: FEATURE_CARD_W,
    borderRadius: borderRadius.card,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
  },
  imageArea: {
    position: 'relative',
    width: '100%',
    height: 140,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  name: {
    fontSize: 13,
    lineHeight: 17,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
  },
  unitBadgeOnImage: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.badge,
    backgroundColor: colors.primary,
  },
  imageWrap: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favouriteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(6,13,10,0.45)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6,19,13,0.62)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unitBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  unitBadgeGreen: {
    backgroundColor: colors.primary,
  },
  // ── Seasonal variant ─────────────────────────────────────────────────────
  seasonalCard: {
    flex: 1,
    height: 320,
    borderRadius: borderRadius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  seasonalInner: {
    flex: 1,
  },
  unitBadgeStandalone: {
    position: 'absolute',
    top: 150,
    left: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  // Unit ("350ml") badge sits in normal flow at the top of the overlay body,
  // directly above the product name — avoids the old absolute badge being
  // overlapped by a tall (2-line) name/description block.
  unitBadgeInline: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  seasonalOverlayBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
  },
  seasonalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addToCartText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  unitBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    padding: spacing.md,
  },
  description: {
    marginTop: 3,
    lineHeight: 15,
    minHeight: 30,
  },
  // Description used by the compact default card — enough line-height to
  // breathe (the old fontSize:10/lineHeight:12 pairing read as cramped).
  cardDesc: {
    marginTop: spacing.xs,
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  // ── Inline stepper ───────────────────────────────────────────────────────
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnCompact: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.control,
    paddingHorizontal: 4,
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperCompact: {
    paddingHorizontal: 1,
    borderRadius: borderRadius.sm,
  },
  stepperBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnCompact: {
    width: 18,
    height: 20,
  },
  stepperQty: {
    minWidth: 18,
    textAlign: 'center',
  },
  stepperQtyCompact: {
    minWidth: 12,
    fontSize: 11,
    lineHeight: 14,
  },

  // ── Rating / price helpers ────────────────────────────────────────────────
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  originalPrice: {
    marginLeft: spacing.sm,
    textDecorationLine: 'line-through',
  },

  // ── Horizontal variant ────────────────────────────────────────────────────
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 116,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: 100,
    height: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
  },
  horizontalContent: {
    flex: 1,
    paddingLeft: spacing.md,
    justifyContent: 'center',
  },

  // ── Compact variant ───────────────────────────────────────────────────────
  compactCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surfaceVariant,
  },
  compactContent: {
    padding: spacing.sm,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
