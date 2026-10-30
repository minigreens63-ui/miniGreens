import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { Skeleton } from '../../components/ui/Skeleton';
import { PressableScale } from '../../components/ui/PressableScale';
import { HeaderIconButton } from '../../components/layout/ScreenHeader';
import { useProducts, useCategories } from '../../services/catalog';
import { useCartStore, cartSubtotal } from '../../store/useCartStore';
import { resolveImageSource } from '../../utils/placeholders';
import type { Product } from '../../types';

// ─── Blend helpers ───────────────────────────────────────────────────────────

// A stable accent hue per blend, drawn from a botanical palette, used for the
// thumbnail ring so a flat list of same-price blends still reads as distinct.
const BLEND_ACCENTS = ['#6f8f4a', '#6f8f4a', '#6f8f4a', '#B58A3C', '#6f8f4a', '#9C6B3B'];
function blendAccent(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BLEND_ACCENTS[h % BLEND_ACCENTS.length];
}

// Split "Green Vitality (Bag)" → { name: "Green Vitality", variant: "(Bag)" }
function splitName(full: string): { name: string; variant?: string } {
  const m = full.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  return m ? { name: m[1].trim(), variant: m[2] } : { name: full.trim() };
}

// Order matters — first match wins for the blend's family.
const TASTE_RULES: { re: RegExp; tag: string; family: string }[] = [
  { re: /hibiscus|\brose\b|floral|petal|uplifting/i, tag: 'floral', family: 'Floral' },
  { re: /masala|cardamom|tulsi|coriander|aromatic|spicy kick/i, tag: 'spiced', family: 'Spiced & Masala' },
  { re: /\bginger\b|warming|comforting/i, tag: 'warming', family: 'Warming' },
  { re: /\bmint\b|cooling|soothing|cool, light/i, tag: 'minty', family: 'Cool & Minty' },
  { re: /apple|\bberry\b|cinnamon|fruity/i, tag: 'fruity', family: 'Fruity' },
  { re: /\blemon\b|lemon peel|citrus|citrusy|\blime\b|zesty/i, tag: 'citrus', family: 'Citrus & Bright' },
  { re: /vitality|everyday|refreshing|nutrient|goodness|detox/i, tag: 'everyday', family: 'Everyday Greens' },
];

const TAG_TO_FAMILY: Record<string, string> = {
  everyday: 'Everyday Greens',
  citrus: 'Citrus & Bright',
  minty: 'Cool & Minty',
  warming: 'Warming',
  spiced: 'Spiced & Masala',
  floral: 'Floral',
  fruity: 'Fruity',
};

// An explicit taste tag on the product wins; otherwise fall back to keyword rules.
function tasteTag(p: Product): string | null {
  for (const t of p.tags || []) if (TAG_TO_FAMILY[t]) return t;
  const hay = `${p.name} ${p.description}`;
  for (const r of TASTE_RULES) if (r.re.test(hay)) return r.tag;
  return null;
}

function blendTags(p: Product): string[] {
  const t = tasteTag(p);
  const out = t ? [t] : ['mild'];
  out.push('caffeine-free');
  return out;
}

// Row pills: taste family + caffeine-free for tea blends; the product's own tags
// (minus the redundant "microgreens" marker) for everything else.
function productTags(p: Product, categorySlug?: string): string[] {
  if (categorySlug === 'tea-blends') return blendTags(p);
  return (p.tags || []).filter((t) => t !== 'microgreens').slice(0, 2);
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// Category chip icon — a quiet visual cue per shop section.
function categoryIcon(slug: string | null): keyof typeof Ionicons.glyphMap {
  switch (slug) {
    case 'tea-blends':
      return 'cafe-outline';
    case 'microgreens':
      return 'flower-outline';
    case 'juices':
      return 'nutrition-outline';
    default:
      return 'leaf';
  }
}

// Section order comes from the admin-managed `sort_order` (useCategories already returns
// categories sorted by it). Anything not in that list, e.g. "other", trails.
function catRank(categories: { slug: string }[], slug: string): number {
  const i = categories.findIndex((c) => c.slug === slug);
  return i === -1 ? 99 : i;
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  index: number;
}

function FilterChip({ label, icon, selected, onPress, index }: ChipProps) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    fill.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected]);

  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 35).springify().damping(24).mass(1).stiffness(100)}
      style={[chipStyle, styles.chipOuter]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          scale.value = withSpring(0.95, { damping: 32, stiffness: 300, mass: 1 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 28, stiffness: 220, mass: 1 }); }, 70);
          onPress();
        }}
        style={[styles.chip, selected && styles.chipSelected]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.chipFill, fillStyle]} />
        <Ionicons
          name={icon}
          size={15}
          color={selected ? colors.textInverse : colors.textSecondary}
          style={styles.chipIcon}
        />
        <Typography
          variant="bodySmall"
          color={selected ? colors.textInverse : colors.textSecondary}
          weight={selected ? 'semibold' : 'regular'}
        >
          {label}
        </Typography>
      </Pressable>
    </Animated.View>
  );
}

// ─── Blend row ───────────────────────────────────────────────────────────────

function BlendRowSkeleton({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 45).springify().damping(31).mass(1).stiffness(100)}
      style={styles.row}
    >
      <Skeleton width={56} height={56} borderRadiusVal={borderRadius.control} />
      <View style={[styles.rowBody, { marginLeft: spacing.md }]}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="85%" height={11} style={{ marginTop: spacing.xs }} />
        <Skeleton width="40%" height={11} style={{ marginTop: spacing.xs }} />
      </View>
      <View style={styles.rowRight}>
        <Skeleton width={40} height={14} />
        <Skeleton width={64} height={26} borderRadiusVal={borderRadius.control} />
      </View>
    </Animated.View>
  );
}

function BlendRow({ product, index, categorySlug }: { product: Product; index: number; categorySlug?: string }) {
  const items = useCartStore((s) => s.items);
  const addItemBySlug = useCartStore((s) => s.addItemBySlug);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [saved, setSaved] = useState(false);

  const inCart = items.find((i) => i.productId === product.id);
  const qty = inCart?.quantity ?? 0;

  const { name, variant } = splitName(product.name);
  const accent = blendAccent(product.name);
  const tags = useMemo(() => productTags(product, categorySlug), [product.id, categorySlug]);

  const toggleSaved = () => {
    Haptics.selectionAsync();
    setSaved((s) => !s);
  };

  const add = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await addItemBySlug(product.slug, 1);
    if (!ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const dec = () => {
    Haptics.selectionAsync();
    if (inCart) updateQuantity(product.id, qty - 1);
  };
  const inc = () => {
    Haptics.selectionAsync();
    if (inCart) updateQuantity(product.id, qty + 1);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 45).springify().damping(31).mass(1).stiffness(100)}
      style={styles.row}
    >
      <Pressable style={styles.rowMain} onPress={() => router.push(`/product/${product.slug}`)}>
        <View style={styles.thumbBox}>
          <View style={[styles.thumbFallback, { backgroundColor: accent + '22' }]}>
            <Ionicons name="leaf" size={24} color={accent} />
          </View>
          <Image source={resolveImageSource(product.images?.[0])} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
        </View>

        <View style={styles.rowBody}>
          <Typography variant="bodySmall" weight="bold" color={colors.textPrimary} numberOfLines={1}>
            {name}
            {variant ? (
              <Typography variant="caption" color={colors.textMuted}>  {variant}</Typography>
            ) : null}
          </Typography>
          <Typography variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.rowDesc}>
            {product.description}
          </Typography>
          <View style={styles.tagRow}>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Typography variant="caption" color={colors.accentSoft} style={styles.tagText}>{capitalize(t)}</Typography>
              </View>
            ))}
          </View>
        </View>
      </Pressable>

      <PressableScale
        style={styles.heartBtn}
        onPress={toggleSaved}
        scaleTo={0.9}
        haptic={false}
        accessibilityLabel={saved ? `Remove ${name} from saved` : `Save ${name}`}
      >
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={17} color={saved ? colors.accent : colors.textTertiary} />
      </PressableScale>

      <View style={styles.rowRight}>
        <Typography variant="bodySmall" weight="bold" color={colors.accent}>
          ₹{product.price}
        </Typography>
        {qty === 0 ? (
          <PressableScale style={styles.addBtn} onPress={add} scaleTo={0.94} haptic={false} accessibilityLabel={`Add ${name}`}>
            <Ionicons name="cart-outline" size={14} color={colors.textInverse} />
            <Typography variant="caption" color={colors.textInverse} weight="bold" style={styles.addBtnText}>Add</Typography>
          </PressableScale>
        ) : (
          <View style={styles.stepper}>
            <TouchableOpacity onPress={dec} hitSlop={8} style={styles.stepBtn}>
              <Ionicons name="remove" size={15} color={colors.primary} />
            </TouchableOpacity>
            <Typography variant="caption" weight="bold" color={colors.textPrimary} style={styles.stepQty}>{qty}</Typography>
            <TouchableOpacity onPress={inc} hitSlop={8} style={styles.stepBtn}>
              <Ionicons name="add" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const { products, isLoading, isError, error, refetch } = useProducts();
  const { categories } = useCategories();

  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const cartTotal = cartSubtotal(cartItems);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Filter chips — only categories that actually have products, tea-first order.
  const catChips = useMemo(() => {
    const withProducts = new Set(
      products.map((p) => catById.get(p.categoryId)?.slug).filter(Boolean) as string[],
    );
    return categories
      .filter((c) => withProducts.has(c.slug))
      .sort((a, b) => catRank(categories, a.slug) - catRank(categories, b.slug));
  }, [products, categories, catById]);

  const visible = selectedCat
    ? products.filter((p) => catById.get(p.categoryId)?.slug === selectedCat)
    : products;

  // Grouped by category, in the preferred tea-first order.
  const groups = useMemo(() => {
    const byCat = new Map<string, Product[]>();
    for (const p of visible) {
      const slug = catById.get(p.categoryId)?.slug ?? 'other';
      if (!byCat.has(slug)) byCat.set(slug, []);
      byCat.get(slug)!.push(p);
    }
    return [...byCat.entries()]
      .map(([slug, items]) => ({
        slug,
        family: categories.find((c) => c.slug === slug)?.name ?? 'More',
        items,
      }))
      .sort((a, b) => catRank(categories, a.slug) - catRank(categories, b.slug));
  }, [visible, catById, categories]);

  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  }, []);

  let rowIndex = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInUp.springify().damping(31).mass(1).stiffness(100)} style={styles.header}>
        <View pointerEvents="none" style={styles.headerFlourish}>
          <Ionicons name="leaf" size={70} color={colors.green[200]} style={styles.flourishLeafBack} />
          <Ionicons name="leaf" size={48} color={colors.primaryLight} style={styles.flourishLeafFront} />
        </View>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Typography variant="label" color={colors.accentSoft}>Shop</Typography>
            <Typography variant="h3" color={colors.textPrimary} style={styles.title}>
              Tea blends, microgreens and juices
            </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
              Fresh, natural and nutritious — from MiniGreens.
            </Typography>
          </View>
          <View style={styles.searchBtn}>
            <HeaderIconButton icon="search" onPress={handleSearch} label="Search" />
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 140 : 40 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <FilterChip
            label="All"
            icon={categoryIcon(null)}
            selected={selectedCat === null}
            onPress={() => setSelectedCat(null)}
            index={0}
          />
          {catChips.map((cat, i) => (
            <FilterChip
              key={cat.slug}
              label={cat.name}
              icon={categoryIcon(cat.slug)}
              selected={selectedCat === cat.slug}
              onPress={() => setSelectedCat(cat.slug)}
              index={i + 1}
            />
          ))}
        </ScrollView>

        {isError && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ErrorNotice message={(error as Error)?.message ?? 'Could not load products.'} onDismiss={() => refetch()} />
          </View>
        )}
        {isLoading && (
          <View style={styles.group}>
            {[0, 1, 2, 3, 4].map((i) => <BlendRowSkeleton key={i} index={i} />)}
          </View>
        )}

        {groups.map((g) => (
          <View key={g.family || 'flat'} style={styles.group}>
            {g.family ? (
              <View style={styles.groupHeader}>
                <Typography variant="label" color={colors.accentSoft}>{g.family}</Typography>
                <Typography variant="caption" color={colors.textMuted}>
                  {g.items.length} {g.items.length === 1 ? 'product' : 'products'}
                </Typography>
              </View>
            ) : null}
            {g.items.map((p) => (
              <BlendRow key={p.id} product={p} index={rowIndex++} categorySlug={g.slug} />
            ))}
          </View>
        ))}

        {!isLoading && !isError && visible.length === 0 && (
          <View style={styles.emptyState}>
            <EmptyState icon="leaf-outline" title="No products here yet" message="Try a different filter." />
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <Animated.View
          entering={FadeInUp.springify().damping(28).mass(1).stiffness(140)}
          style={[styles.cartBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
        >
          <View>
            <Typography variant="caption" color="rgba(255,255,255,0.75)">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Typography>
            <Typography variant="bodySmall" weight="bold" color={colors.textInverse}>₹{cartTotal}</Typography>
          </View>
          <TouchableOpacity style={styles.cartBarBtn} onPress={() => router.push('/cart')} activeOpacity={0.9}>
            <Typography variant="bodySmall" weight="bold" color={colors.primary}>View cart</Typography>
            <Ionicons name="arrow-forward" size={15} color={colors.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerFlourish: {
    position: 'absolute',
    top: -6,
    right: -8,
    width: 100,
    height: 100,
  },
  flourishLeafBack: {
    position: 'absolute',
    top: 2,
    right: 0,
    opacity: 0.5,
    transform: [{ rotate: '18deg' }],
  },
  flourishLeafFront: {
    position: 'absolute',
    top: 34,
    right: 32,
    opacity: 0.55,
    transform: [{ rotate: '-12deg' }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    marginTop: 2,
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 4,
  },
  searchBtn: {
    marginLeft: spacing.md,
  },
  chipsScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chipOuter: {
    marginRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipSelected: {
    borderColor: colors.primary,
  },
  chipFill: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },

  group: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbBox: {
    width: 76,
    height: 100,
    borderRadius: borderRadius.control,
    marginRight: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  thumbFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowDesc: {
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.accentSurface,
    borderRadius: borderRadius.badge,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9.5,
    lineHeight: 13,
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  addBtnText: {
    marginLeft: 3,
    fontSize: 11,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    minWidth: 18,
    textAlign: 'center',
  },

  emptyState: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.cardLarge,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.raised,
  },
  cartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
  },
});
