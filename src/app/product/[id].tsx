import React, { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { BRAND_CLAIM_SHORT } from '../../theme/brand';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCard } from '../../components/product/ProductCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/layout/Screen';
import { HeaderIconButton } from '../../components/layout/ScreenHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { BottomActionBar } from '../../components/layout/BottomActionBar';
import { useProduct, useProducts } from '../../services/catalog';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';
import { useCartStore } from '../../store/useCartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

function CartButton() {
  const cartCount = useCartStore((s) => s.items.length);
  return (
    <View>
      <HeaderIconButton icon="bag-outline" onPress={() => router.push('/cart')} label="Open cart" />
      {cartCount > 0 && (
        <View style={styles.cartBadge} pointerEvents="none">
          <Typography style={styles.cartBadgeText} color={colors.textInverse}>
            {cartCount}
          </Typography>
        </View>
      )}
    </View>
  );
}

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const quantityScale = useSharedValue(1);
  const quantityAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: quantityScale.value }],
  }));

  const { data: product, isLoading } = useProduct(id);
  const { products: allProducts } = useProducts();
  const relatedProducts = allProducts.filter(
    (p) => p.categoryId === product?.categoryId && p.id !== product?.id
  );

  if (isLoading) {
    return (
      <Screen title="Details">
        <Skeleton width={HERO_WIDTH} height={HERO_WIDTH * 0.85} borderRadiusVal={borderRadius.cardLarge} />
        <View style={styles.content}>
          <Skeleton width="35%" height={12} />
          <Skeleton width="70%" height={24} style={{ marginTop: spacing.sm }} />
          <Skeleton width={120} height={32} style={{ marginTop: spacing.lg }} />
          <Skeleton width="50%" height={16} style={{ marginTop: spacing.lg }} />
          <Skeleton width="100%" height={80} style={{ marginTop: spacing.xl }} />
        </View>
      </Screen>
    );
  }

  const unavailable = !!product && (!product.isAvailable || (!product.isPreorder && product.stock <= 0));

  if (!product) {
    return (
      <Screen title="Details" scroll={false}>
        <EmptyState
          icon="leaf-outline"
          title="Product not found"
          message="It may have been removed or is no longer available."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const bumpQuantity = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((q) => Math.max(1, q + delta));
    quantityScale.value = withSequence(
      withSpring(delta > 0 ? 1.12 : 0.92, { damping: 19, stiffness: 100, mass: 1 }),
      withSpring(1, { damping: 20, stiffness: 100, mass: 1 })
    );
  };

  return (
    <Screen
      title="Details"
      headerRight={<CartButton />}
      footer={
        <BottomActionBar>
          <View>
            <Typography variant="caption" color={colors.textTertiary}>Total</Typography>
            <Typography variant="h3" color={colors.accent}>
              ₹{(product.price * quantity).toFixed(2)}
            </Typography>
          </View>
          {product.isPreorder && !unavailable ? (
            <Button
              title="Pre-order"
              variant="primary"
              size="lg"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/preorder/${product.slug}?qty=${quantity}`);
              }}
            />
          ) : (
            <Button
              title={unavailable ? (product.isAvailable ? 'Out of Stock' : 'Currently Unavailable') : 'Add to Cart'}
              variant="primary"
              size="lg"
              disabled={unavailable}
              loading={adding}
              onPress={async () => {
                setAdding(true);
                const ok = await useCartStore.getState().addItemBySlug(product.slug, quantity);
                setAdding(false);
                if (ok) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  router.push('/cart');
                } else {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
              }}
            />
          )}
        </BottomActionBar>
      }
    >
      {/* Hero image: a rounded card, like Home's hero */}
      <Animated.View entering={FadeInUp.springify().damping(34).stiffness(180).mass(1)}>
        <View style={styles.imageContainer}>
          {product.images[selectedImage] ? (
            <Image source={resolveImageSource(product.images[selectedImage])} style={styles.mainImage} />
          ) : (
            <PlaceholderImage label={product.name} style={styles.mainImage} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(29,43,32,0.28)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
          {discountPct && (
            <Animated.View
              entering={ZoomIn.delay(200).springify().damping(19).mass(1).stiffness(100)}
              style={styles.discountBadge}
            >
              <Typography variant="caption" color={colors.textInverse} weight="bold">
                -{discountPct}%
              </Typography>
            </Animated.View>
          )}
          {product.images.length > 1 && (
            <View style={styles.imageDots}>
              {product.images.map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  hitSlop={8}
                  accessibilityLabel={`Show image ${index + 1}`}
                  style={[styles.imageDot, index === selectedImage && styles.imageDotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.content}>
        {/* Title & Price */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="caption" color={colors.primary} weight="medium" uppercase>
            {product.unit}
          </Typography>
          <Typography variant="h3" color={colors.text} style={styles.productName}>
            {product.name}
          </Typography>
        </Animated.View>

        <Animated.View
          entering={ZoomIn.delay(200).springify().damping(19).mass(1).stiffness(100)}
          style={styles.priceRow}
        >
          <View style={styles.pricePill}>
            <Typography variant="h2" color={colors.accent}>
              ₹{product.price.toFixed(2)}
            </Typography>
          </View>
          {product.originalPrice && (
            <Typography variant="body" color={colors.textTertiary} style={styles.originalPrice}>
              ₹{product.originalPrice.toFixed(2)}
            </Typography>
          )}
        </Animated.View>

        {product.isPreorder && !unavailable && (
          <Animated.View entering={FadeInUp.delay(230).springify().damping(31).mass(1).stiffness(100)} style={styles.preorderNote}>
            <Ionicons name="time-outline" size={15} color={colors.primaryDark} />
            <Typography variant="caption" color={colors.primaryDark} weight="semibold" style={{ marginLeft: spacing.xs }}>
              Available for pre-order. Reserve yours now.
            </Typography>
          </Animated.View>
        )}

        {/* Rating */}
        <Animated.View entering={FadeInUp.delay(260).springify().damping(31).mass(1).stiffness(100)} style={styles.ratingRow}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(product.rating) ? 'star' : 'star-outline'}
                size={16}
                color={colors.warning}
              />
            ))}
          </View>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            {product.rating} ({product.reviewCount} reviews)
          </Typography>
        </Animated.View>

        {/* Quantity Selector */}
        <Animated.View
          entering={FadeInUp.delay(320).springify().damping(31).mass(1).stiffness(100)}
          style={styles.quantitySection}
        >
          <Typography variant="bodySmall" weight="semibold">Quantity</Typography>
          <View style={styles.quantitySelector}>
            <PressableScale
              style={styles.quantityButton}
              scaleTo={0.92}
              haptic={false}
              onPress={() => bumpQuantity(-1)}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={20} color={colors.primaryDark} />
            </PressableScale>
            <Animated.View style={quantityAnimStyle}>
              <Typography variant="h4" weight="bold" style={styles.quantityValue} color={colors.accent}>
                {quantity}
              </Typography>
            </Animated.View>
            <PressableScale
              style={styles.quantityButton}
              scaleTo={0.92}
              haptic={false}
              onPress={() => bumpQuantity(1)}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={20} color={colors.primaryDark} />
            </PressableScale>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(380).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="caption" color={colors.accent} style={{ marginTop: spacing.xl }}>
            Grown in India · {BRAND_CLAIM_SHORT}
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.description}>
            {product.description}
          </Typography>
        </Animated.View>

        {/* Nutrition */}
        <Animated.View entering={FadeInUp.delay(420).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <SectionHeader title="Nutrition" />
          <View style={styles.nutritionGrid}>
            {[
              { label: 'Calories', value: `${product.nutrition.calories}` },
              { label: 'Protein', value: product.nutrition.protein },
              { label: 'Carbs', value: product.nutrition.carbs },
              { label: 'Fat', value: product.nutrition.fat },
              { label: 'Fiber', value: product.nutrition.fiber },
            ].map((item, index) => (
              <View key={index} style={styles.nutritionItem}>
                <Typography variant="bodySmall" color={colors.accent} weight="bold">
                  {item.value}
                </Typography>
                <Typography variant="caption" color={colors.textSecondary} style={styles.nutritionLabel}>
                  {item.label}
                </Typography>
              </View>
            ))}
          </View>
          <View style={styles.vitamins}>
            <Typography variant="bodySmall" weight="semibold">Vitamins & Minerals: </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary}>
              {product.nutrition.vitamins.join(', ')}
            </Typography>
          </View>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInUp.delay(460).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <SectionHeader title="Benefits" />
          {product.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginLeft: spacing.sm, flex: 1 }}>
                {benefit}
              </Typography>
            </View>
          ))}
        </Animated.View>

        {/* Storage */}
        <Animated.View entering={FadeInUp.delay(500).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <SectionHeader title="Storage" />
          <View style={styles.storageCard}>
            <Ionicons name="snow-outline" size={20} color={colors.primary} />
            <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginLeft: spacing.sm, flex: 1 }}>
              {product.storage}
            </Typography>
          </View>
        </Animated.View>

        {/* Consumption Tips */}
        <Animated.View entering={FadeInUp.delay(540).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <SectionHeader title="How to enjoy" />
          {product.consumptionTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Typography variant="caption" color={colors.primaryDark} weight="bold">
                  {String(index + 1).padStart(2, '0')}
                </Typography>
              </View>
              <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginLeft: spacing.md, flex: 1 }}>
                {tip}
              </Typography>
            </View>
          ))}
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInUp.delay(580).springify().damping(31).mass(1).stiffness(100)} style={styles.tagsSection}>
          {product.tags.map((tag, index) => (
            <Chip key={index} label={tag} variant="outlined" color={colors.primary} />
          ))}
        </Animated.View>
      </View>

      {/* Related Products: horizontal, full-bleed to the screen edge */}
      {relatedProducts.length > 0 && (
        <Animated.View entering={FadeInUp.delay(620).springify().damping(31).mass(1).stiffness(100)} style={styles.section}>
          <SectionHeader title="You may also like" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}
          >
            {relatedProducts.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                variant="compact"
                index={i}
                onPress={() => router.push(`/product/${p.slug}`)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  mainImage: {
    width: HERO_WIDTH,
    height: HERO_WIDTH * 0.85,
    backgroundColor: colors.surfaceVariant,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
  },
  imageDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageDotActive: {
    width: 24,
    backgroundColor: colors.textInverse,
  },
  content: {
    paddingTop: spacing.lg,
  },
  productName: {
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  pricePill: {
    backgroundColor: colors.accentSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  preorderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    marginHorizontal: spacing.lg,
    minWidth: 24,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  section: {
    marginTop: spacing.sectionGap,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nutritionItem: {
    flexGrow: 1,
    flexBasis: '17%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.accentSurface,
    borderRadius: borderRadius.md,
  },
  nutritionLabel: {
    marginTop: 2,
  },
  vitamins: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },
  relatedScroll: {
    paddingRight: spacing.lg,
  },
});
