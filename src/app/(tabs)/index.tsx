import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows, fontFamily } from '../../theme';
import { BRAND_CLAIM_SHORT } from '../../theme/brand';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';
import { ProductCard } from '../../components/product/ProductCard';
import { CategoryCard } from '../../components/home/CategoryCard';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import {
  banners,
  lifestyleArticles,
  testimonials,
  whyChooseUs,
} from '../../mock';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useCategories } from '../../services/catalog';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { supabase } from '../../lib/supabase';
import { resolveImageSource } from '../../utils/placeholders';
import { isBirthdayToday } from '../../utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Botanical environment asset — sits BEHIND all Home Screen content as part of
// the background (never rendered as a normal image/card). See Phase 3.
const LEAF_BG = require('../../../assets/leaf.png');
// rgb() of colors.background — readability scrim base. Tea-focus light theme:
// matches the pale-green canvas (#F3F7EA). The foliage image itself is disabled
// below for the light look.
const BG_RGB = '243,247,234';

// Hero card photo — glass cup of microgreen tea (assets/tea-hero.png).
const TEA_HERO = require('../../../assets/tea-hero.png');
// Promo card background — bright microgreen tray with pale space on the left.
const PROMO_BG = require('../../../assets/bannerpic.png');

// Local art for the circular category row, matched by category name. Falls back
// to the Supabase `category.image` when nothing matches.
const CATEGORY_ART: { re: RegExp; img: number }[] = [
  { re: /tea\s*blend|blend/i, img: require('../../../assets/cat-tea-blends.png') },
  { re: /loose|leaf/i, img: require('../../../assets/cat-loose-leaf.png') },
  { re: /kit/i, img: require('../../../assets/cat-tea-kits.png') },
  { re: /accessor/i, img: require('../../../assets/cat-accessories.png') },
  { re: /tea|microgreen|green/i, img: require('../../../assets/cat-microgreens.png') },
];
function categoryArt(name: string): number | null {
  for (const c of CATEGORY_ART) if (c.re.test(name)) return c.img;
  return null;
}

// "Bowls" isn't a catalogue category in Supabase (no bowl products yet), but the
// reference Home Screen shows it as a fourth tile. Render it locally from the
// bundled asset; tapping it opens the browse screen rather than an empty
// /category/bowls route.
const BOWLS_TILE = {
  id: 'bowls-local',
  name: 'Bowls',
  slug: 'bowls',
  description: 'Fresh fruit & smoothie bowls.',
  image: require('../../assets/bowls.jpeg') as unknown as string,
  icon: 'nutrition',
  productCount: 0,
  color: '#F472B6',
};

// ─── Find Your Blend — tea moments quiz-style picker ─────────────────────────
// Ported from webapp/lib/blends.ts (MGC 2.0 brief) so the taste language stays
// identical across platforms; the DB only holds price/rating, not taste copy.

type BlendMoment = { id: string; title: string; blurb: string; icon: keyof typeof Ionicons.glyphMap; slugs: [string, string] };

const BLEND_PROFILE: Record<string, { notes: string }> = {
  'green-vitality-bag': { notes: 'Lemongrass & mint' },
  'green-lemon-bag': { notes: 'Lemongrass & lemon peel' },
  'green-detox-bag': { notes: 'Mint & coriander' },
  'green-masala-bag': { notes: 'Ginger, tulsi & cardamom' },
  'mint-green-bag': { notes: 'Mint & lemongrass' },
  'green-apple-bag': { notes: 'Dried apple & cinnamon' },
  'ginger-green-bag': { notes: 'Ginger & lemon peel' },
  'green-hibiscus-bag': { notes: 'Hibiscus, mint & lemon peel' },
};

const BLEND_MOMENTS: BlendMoment[] = [
  { id: 'morning', title: 'Morning Energy', blurb: 'Bright, fresh starts.', icon: 'sunny-outline', slugs: ['green-vitality-bag', 'green-lemon-bag'] },
  { id: 'detox', title: 'Daily Detox', blurb: 'Clean, lively greens.', icon: 'leaf-outline', slugs: ['green-detox-bag', 'green-hibiscus-bag'] },
  { id: 'warm', title: 'Warm & Comforting', blurb: 'Cosy, spiced cups.', icon: 'flame-outline', slugs: ['green-masala-bag', 'ginger-green-bag'] },
  { id: 'cool', title: 'Cool & Light', blurb: 'Easy after-meal sips.', icon: 'snow-outline', slugs: ['mint-green-bag', 'green-apple-bag'] },
];

function FindYourBlendSection({ products, onProductPress }: { products: ReturnType<typeof useProducts>['products']; onProductPress: (slug: string) => void }) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const moments = BLEND_MOMENTS.map((m) => ({ ...m, blends: m.slugs.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p) })).filter((m) => m.blends.length > 0);

  if (moments.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="h3" color={colors.text}>Find Your Blend</Typography>
        <Typography variant="caption" color={colors.textTertiary} style={styles.sectionSub}>
          Pick by the moment you drink it.
        </Typography>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        {moments.map((m) => (
          <View key={m.id} style={blendStyles.card}>
            <View style={blendStyles.cardHeader}>
              <View style={blendStyles.iconWrap}>
                <Ionicons name={m.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodySmall" weight="bold" numberOfLines={1}>{m.title}</Typography>
                <Typography variant="caption" color={colors.textTertiary} numberOfLines={1}>{m.blurb}</Typography>
              </View>
            </View>
            {m.blends.map((b) => (
              <Pressable
                key={b.slug}
                style={blendStyles.row}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onProductPress(b.slug);
                }}
              >
                <Image source={resolveImageSource(b.images[0])} style={blendStyles.rowImage} resizeMode="cover" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" weight="bold" numberOfLines={1}>{b.name}</Typography>
                  <Typography variant="caption" color={colors.textTertiary} numberOfLines={1} style={{ fontSize: 10 }}>
                    {BLEND_PROFILE[b.slug]?.notes}
                  </Typography>
                  <Typography variant="caption" weight="semibold" color={colors.accent} style={{ fontSize: 11, marginTop: 2 }}>
                    ₹{b.price.toFixed(0)}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const blendStyles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: spacing.md,
    borderRadius: borderRadius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  rowImage: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
});

// ─── Signature product spotlight ─────────────────────────────────────────────

const SIGNATURE_SLUG = 'green-detox-bag';

function SignatureProductSection({ products, onProductPress }: { products: ReturnType<typeof useProducts>['products']; onProductPress: (slug: string) => void }) {
  const product = products.find((p) => p.slug === SIGNATURE_SLUG);
  if (!product) return null;

  return (
    <View style={styles.section}>
      <View style={signatureStyles.card}>
        <View style={signatureStyles.imageWrap}>
          <Image source={resolveImageSource(product.images[0])} style={signatureStyles.image} resizeMode="cover" />
        </View>
        <View style={signatureStyles.content}>
          <Typography variant="caption" weight="bold" color={colors.primaryLight} style={{ letterSpacing: 1, fontSize: 9 }}>
            OUR SIGNATURE PRODUCT
          </Typography>
          <Typography variant="h3" color={colors.textInverse} style={{ marginTop: spacing.xs }}>
            {product.name}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={2} style={{ marginTop: spacing.xs, lineHeight: 15 }}>
            {product.description}
          </Typography>
          <Typography variant="h4" color={colors.textInverse} weight="bold" style={{ marginTop: spacing.sm }}>
            ₹{product.price.toFixed(0)}
          </Typography>
          <View style={signatureStyles.ctaRow}>
            <TouchableOpacity
              style={signatureStyles.ctaBtn}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await useCartStore.getState().addItemBySlug(product.slug, 1);
              }}
            >
              <Typography variant="bodySmall" weight="bold" color={colors.primary}>Add to Cart</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onProductPress(product.slug)}>
              <Typography variant="caption" color="rgba(255,255,255,0.85)" weight="semibold">View details</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const signatureStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    backgroundColor: colors.green[800],
    flexDirection: 'row',
    minHeight: 180,
  },
  imageWrap: {
    width: '38%',
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  ctaBtn: {
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
  },
});

// ─── Farm story — seed-to-doorstep, mirrors webapp's FarmStory section ───────

const FARM_STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string }[] = [
  { icon: 'water-outline', title: 'Seed' },
  { icon: 'leaf-outline', title: 'Grow' },
  { icon: 'cut-outline', title: 'Harvest' },
  { icon: 'cube-outline', title: 'Deliver' },
];

function FarmStorySection() {
  return (
    <View style={styles.section}>
      <View style={farmStyles.card}>
        <Image
          source={PROMO_BG}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(20,38,25,0.92)', 'rgba(20,38,25,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={farmStyles.content}>
          <Typography variant="caption" weight="bold" color={colors.secondaryLight} style={{ letterSpacing: 1, fontSize: 9 }}>
            FROM SEED TO A BRIGHTER YOU
          </Typography>
          <Typography variant="h3" color={colors.textInverse} style={{ marginTop: spacing.xs }}>
            From Our Farm{'\n'}to Your Cup
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: spacing.sm, lineHeight: 16 }}>
            Grown by MGC and our partner growers to one quality standard, cut fresh and delivered at
            their peak. No middlemen, no long storage.
          </Typography>
        </View>
      </View>
      <View style={farmStyles.stepsRow}>
        {FARM_STEPS.map((s) => (
          <View key={s.title} style={farmStyles.step}>
            <View style={farmStyles.stepIcon}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
            </View>
            <Typography variant="caption" weight="semibold" style={{ marginTop: 6 }}>{s.title}</Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

const farmStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
    backgroundColor: colors.surfaceDark,
  },
  content: {
    padding: spacing.lg,
    maxWidth: '85%',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Business CTA — general "order in bulk / become a partner" strip, shown
//     to every visitor (mirrors webapp's BusinessStrip + PartnerSection) ─────

const BUSINESS_CHIPS: { icon: keyof typeof Ionicons.glyphMap; label: string; type: string }[] = [
  { icon: 'cafe-outline', label: 'Cafés', type: 'cafe' },
  { icon: 'restaurant-outline', label: 'Restaurants', type: 'restaurant' },
  { icon: 'storefront-outline', label: 'Shops', type: 'shop' },
  { icon: 'barbell-outline', label: 'Gyms & wellness', type: 'fitness_wellness' },
];

function BusinessCTASection() {
  return (
    <View style={styles.section}>
      <View style={businessStyles.card}>
        <Typography variant="caption" weight="bold" color={colors.primary} style={{ letterSpacing: 1, fontSize: 9 }}>
          FOR BUSINESS
        </Typography>
        <Typography variant="h3" color={colors.text} style={{ marginTop: spacing.xs }}>
          Order Fresh Greens in Bulk
        </Typography>
        <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          Regular supply for your menu, shelves or members, with wholesale pricing.
        </Typography>
        <View style={businessStyles.chipRow}>
          {BUSINESS_CHIPS.map((c) => (
            <TouchableOpacity
              key={c.type}
              style={businessStyles.chip}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/partner/apply?type=${c.type}` as any);
              }}
            >
              <Ionicons name={c.icon} size={14} color={colors.primary} />
              <Typography variant="caption" weight="semibold">{c.label}</Typography>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title="Register Your Business"
          onPress={() => router.push('/partner/apply?type=cafe' as any)}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </View>
  );
}

const businessStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
});

// ─── Birthday / DOB nudge — mirrors webapp's JoinSection perk, reusing the
//     existing account system instead of a separate mailing list ────────────

function DobNudgeBanner() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const [dismissed, setDismissed] = useState(false);

  if (!session || !profile || profile.date_of_birth || dismissed) return null;

  return (
    <TouchableOpacity
      style={styles.offersBanner}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/profile/edit');
      }}
    >
      <View style={styles.birthdayIcon}>
        <Ionicons name="gift-outline" size={16} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="bodySmall" weight="bold" color={colors.textPrimary}>
          Add your birthday
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          Unlock a reward in your birthday month
        </Typography>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        hitSlop={10}
        style={{ marginLeft: spacing.sm }}
      >
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Trust strip — immediate credibility signals above the fold ─────────────

const TRUST_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'bicycle', label: 'Free delivery ₹499+' },
  { icon: 'star', label: '4.9 rated' },
  { icon: 'leaf', label: '100% organic' },
];

function TrustStrip() {
  return (
    <View style={styles.trustStrip}>
      {TRUST_ITEMS.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={styles.trustItem}>
            <Ionicons name={item.icon} size={13} color={colors.primary} />
            <Typography variant="caption" color={colors.textSecondary} weight="semibold" style={styles.trustLabel} numberOfLines={1}>
              {item.label}
            </Typography>
          </View>
          {i < TRUST_ITEMS.length - 1 && <View style={styles.trustDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Live offers teaser — surfaces the best active discount, links to /offers ─

function OffersBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: topDiscount } = useQuery({
    queryKey: ['home-top-discount'],
    queryFn: async () => {
      const { data } = await supabase
        .from('discounts')
        .select('code, discount_type, value, starts_at, expires_at, usage_limit, used_count')
        .eq('is_active', true)
        .eq('is_birthday_offer', false)
        .order('value', { ascending: false })
        .limit(20);
      const now = Date.now();
      // Same validity rules as /offers — filter in JS since "top by value" alone can
      // surface a code that's expired, not started yet, or past its usage cap.
      return (
        (data ?? []).find((d) => {
          if (d.starts_at && new Date(d.starts_at).getTime() > now) return false;
          if (d.expires_at && new Date(d.expires_at).getTime() < now) return false;
          if (d.usage_limit != null && d.used_count >= d.usage_limit) return false;
          return true;
        }) ?? null
      );
    },
  });

  if (!topDiscount || dismissed) return null;

  const valueLabel =
    topDiscount.discount_type === 'percentage'
      ? `${Number(topDiscount.value) % 1 === 0 ? Number(topDiscount.value) : Number(topDiscount.value).toFixed(1)}% OFF`
      : `₹${Number(topDiscount.value).toFixed(0)} OFF`;

  return (
    <TouchableOpacity
      style={styles.offersBanner}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/offers');
      }}
    >
      <View style={styles.offersIcon}>
        <Ionicons name="pricetag" size={16} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="bodySmall" weight="bold" color={colors.textPrimary}>
          {valueLabel} with code {topDiscount.code}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          Tap to see all live offers
        </Typography>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        hitSlop={10}
        style={{ marginLeft: spacing.sm }}
      >
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function useStaggeredEntry(delay: number) {
  const y = useSharedValue(24);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withSpring(0, { damping: 37, stiffness: 160, mass: 1 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));
}

function BirthdayBanner() {
  const profile = useAuthStore((s) => s.profile);
  const [dismissed, setDismissed] = useState(false);
  const isBirthday = isBirthdayToday(profile?.date_of_birth);

  const { data: offer } = useQuery({
    queryKey: ['birthday-discount'],
    enabled: isBirthday,
    queryFn: async () => {
      const { data } = await supabase
        .from('discounts')
        .select('code, description, starts_at, expires_at, usage_limit, used_count')
        .eq('is_birthday_offer', true)
        .eq('is_active', true)
        .limit(20);
      const now = Date.now();
      return (
        (data ?? []).find((d) => {
          if (d.starts_at && new Date(d.starts_at).getTime() > now) return false;
          if (d.expires_at && new Date(d.expires_at).getTime() < now) return false;
          if (d.usage_limit != null && d.used_count >= d.usage_limit) return false;
          return true;
        }) ?? null
      );
    },
  });

  if (!isBirthday || dismissed) return null;

  return (
    <View style={styles.birthdayBanner}>
      <View style={styles.birthdayIcon}>
        <Ionicons name="gift" size={20} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="bodySmall" weight="bold" color={colors.textInverse}>
          Happy Birthday!
        </Typography>
        <Typography variant="caption" color="rgba(255,255,255,0.75)">
          {offer?.code
            ? `Use code ${offer.code} for your birthday treat.`
            : offer?.description || 'Enjoy a little something from us today.'}
        </Typography>
      </View>
      <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={10}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Tea hero card ("Nature in a cup / Microgreen Tea") ──────────────────────

const HERO_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'leaf', label: 'Rich in\nAntioxidants' },
  { icon: 'heart', label: 'Supports\nImmunity' },
  { icon: 'flash', label: 'Natural\nEnergy' },
];

function TeaHeroCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.hero}>
      <Image
        source={TEA_HERO}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(228,238,202,0.8)', 'rgba(228,238,202,0.32)', 'rgba(228,238,202,0.04)', 'rgba(228,238,202,0)']}
        locations={[0, 0.34, 0.58, 0.8]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.heroText}>
        <View style={styles.heroKickerRow}>
          <Typography variant="caption" weight="bold" color={colors.accentSoft} style={styles.heroKicker}>
            NATURE IN A CUP
          </Typography>
          <View style={styles.heroRatingChip}>
            <Ionicons name="star" size={9} color={colors.secondary} />
            <Typography variant="caption" weight="bold" color={colors.textPrimary} style={styles.heroRatingText}>
              4.9
            </Typography>
          </View>
        </View>
        <Typography variant="h3" color={colors.primary} style={styles.heroTitle}>
          Microgreen Tea
        </Typography>
        <Typography variant="caption" color={colors.textSecondary} style={styles.heroSub}>
          More nutrients.{'\n'}A calmer, healthier you.
        </Typography>
        <TouchableOpacity style={styles.heroBtn} onPress={onPress} activeOpacity={0.9}>
          <Typography
            variant="caption"
            color={colors.textInverse}
            weight="bold"
            numberOfLines={1}
            style={styles.heroBtnText}
          >
            Shop Microgreen Tea
          </Typography>
          <Ionicons name="arrow-forward" size={12} color={colors.textInverse} style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroBadges}>
        {HERO_BENEFITS.map((b) => (
          <View key={b.label} style={styles.heroBadge}>
            <View style={styles.heroBadgeIcon}>
              <Ionicons name={b.icon} size={15} color={colors.primary} />
            </View>
            <Typography
              variant="caption"
              color={colors.textSecondary}
              align="center"
              style={styles.heroBadgeLabel}
            >
              {b.label}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

function PartnerBanner() {
  const role = useAuthStore((s) => s.profile?.role);
  const partnerStatus = useAuthStore((s) => s.partnerStatus);
  const approved = role === 'partner' || partnerStatus === 'approved';
  if (!approved && partnerStatus !== 'pending') return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={partnerStyles.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(approved ? '/partner/business-order' : '/partner/submitted');
      }}
    >
      <View style={partnerStyles.icon}>
        <Ionicons name={approved ? 'storefront-outline' : 'time-outline'} size={20} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="body" weight="bold" color={colors.text}>
          {approved ? 'MGC Partner' : 'Partner application under review'}
        </Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          {approved ? 'Place a business order' : "We'll email you once it's approved"}
        </Typography>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const partnerStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchFocused, setSearchFocused] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const { products, isLoading: productsLoading } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread', profile?.id],
    enabled: !!profile?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile!.id)
        .is('read_at', null);
      return count ?? 0;
    },
  });
  const featuredProducts = products.filter((p) => p.isFeatured);
  const seasonalProducts = products.filter((p) => p.isSeasonal);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const [activeCat, setActiveCat] = useState<string | undefined>(undefined);
  // Visual default only — highlight the first category until the user picks one
  // (matches the reference). Tapping still navigates exactly as before.
  const selectedCat = activeCat ?? categories[0]?.id;

  const headerStyle   = useStaggeredEntry(0);
  const searchStyle   = useStaggeredEntry(80);
  const section1Style = useStaggeredEntry(160);
  const section2Style = useStaggeredEntry(250);
  const section3Style = useStaggeredEntry(300);

  const searchScale = useSharedValue(1);
  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const handleSearchFocus = useCallback(() => {
    searchScale.value = withSpring(1.02, { damping: 31, stiffness: 220, mass: 1 });
    setSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    searchScale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 });
    setSearchFocused(false);
  }, []);

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  }, []);

  const handleProductPress = useCallback((slug: string) => router.push(`/product/${slug}`), []);
  const handleCategoryPress = useCallback((slug: string) => router.push(`/category/${slug}`), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Typography
                variant="h2"
                color={colors.textPrimary}
                numberOfLines={1}
                style={[styles.brandName, styles.headerNameText]}
              >
                MiniGreens
              </Typography>
              <Ionicons name="leaf" size={20} color={colors.accent} style={styles.brandLeaf} />
            </View>
            <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {BRAND_CLAIM_SHORT}
            </Typography>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notifications');
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/cart');
              }}
            >
              <Ionicons name="bag-outline" size={20} color={colors.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Typography variant="caption" color={colors.onAccent} style={{ fontSize: 10, fontWeight: '700' }}>
                    {cartCount}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[styles.searchContainer, searchStyle, searchAnimStyle]}>
          <SearchBar
            value=""
            onChangeText={() => {}}
            placeholder="Search microgreen tea blends..."
            onPress={handleSearchPress}
          />
        </Animated.View>

        <PartnerBanner />

        {/* Trust strip */}
        <Animated.View style={searchStyle}>
          <TrustStrip />
        </Animated.View>

        {/* Tea hero card */}
        <Animated.View style={[styles.heroWrap, section1Style]}>
          <TeaHeroCard onPress={() => router.push('/(tabs)/explore')} />
        </Animated.View>

        <BirthdayBanner />
        <DobNudgeBanner />
        <OffersBanner />

        {/* Categories — circular tiles under the hero */}
        <Animated.View style={[styles.categoriesRow, section1Style]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {categoriesLoading
              ? [0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.categorySkeletonWrap}>
                    <Skeleton width={66} height={66} borderRadiusVal={33} />
                    <Skeleton width={40} height={10} style={{ marginTop: spacing.sm }} />
                  </View>
                ))
              : categories.map((cat, i) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    variant="circle"
                    imageOverride={categoryArt(cat.name)}
                    index={i}
                    active={cat.id === selectedCat}
                    onPress={() => {
                      setActiveCat(cat.id);
                      handleCategoryPress(cat.slug);
                    }}
                  />
                ))}
          </ScrollView>
        </Animated.View>

        {/* Best Sellers */}
        <Animated.View style={[styles.section, section2Style]}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Typography variant="h3" color={colors.textPrimary}>Best Selling{'\n'}Microgreen Teas</Typography>
              <Typography variant="caption" color={colors.textTertiary} style={styles.sectionSub}>
                Customer favourites, brewed for a better you.
              </Typography>
            </View>
            <TouchableOpacity style={[styles.viewAll, { flexShrink: 0 }]} onPress={() => router.push('/(tabs)/explore')}>
              <Typography variant="bodySmall" color={colors.accent} weight="semibold">View all</Typography>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {productsLoading
              ? [0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)
              : bestSellers.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onPress={() => handleProductPress(product.slug)}
                  />
                ))}
          </ScrollView>
        </Animated.View>

        <FindYourBlendSection products={products} onProductPress={handleProductPress} />

        {/* Microgreen benefits — dark promo card */}
        <Animated.View style={[section3Style, styles.section]}>
          <View style={styles.promoCard}>
            <Image
              source={PROMO_BG}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(30,52,34,0.96)', 'rgba(30,52,34,0.6)', 'rgba(30,52,34,0.12)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.promoText}>
              <Typography variant="caption" color={colors.secondaryLight} weight="bold" style={styles.promoKicker}>
                SMALL GREENS. BIG BENEFITS.
              </Typography>
              <Typography variant="h3" color={colors.textInverse} style={styles.promoTitle}>
                Live Healthier{'\n'}with Microgreens
              </Typography>
              <TouchableOpacity
                style={styles.promoBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/explore');
                }}
              >
                <Typography variant="bodySmall" color={colors.primary} weight="bold" numberOfLines={1} style={styles.promoBtnText}>Explore Teas</Typography>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
            <View style={styles.promoBadges}>
              {[
                { icon: 'shield-checkmark' as const, label: 'Detox Naturally' },
                { icon: 'heart' as const, label: 'Boost Immunity' },
                { icon: 'flash' as const, label: 'Stay Energized' },
              ].map((b) => (
                <View key={b.label} style={styles.promoBadgeRow}>
                  <View style={styles.promoBadgeIcon}>
                    <Ionicons name={b.icon} size={12} color={colors.textInverse} />
                  </View>
                  <Typography variant="caption" color="rgba(255,255,255,0.9)" style={styles.promoBadgeLabel} numberOfLines={1}>
                    {b.label}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <SignatureProductSection products={products} onProductPress={handleProductPress} />

        {/* Seasonal Products */}
        {seasonalProducts.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(360).springify().damping(31).mass(1).stiffness(100)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Typography variant="h3" color={colors.text}>Seasonal Picks</Typography>
              <TouchableOpacity style={styles.viewAll} onPress={() => router.push('/(tabs)/explore')}>
                <Typography variant="bodySmall" color={colors.primary} weight="semibold">View all</Typography>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {seasonalProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  onPress={() => handleProductPress(product.slug)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Featured Products */}
        <Animated.View
          entering={FadeInUp.delay(420).springify().damping(31).mass(1).stiffness(100)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={colors.text}>Featured Products</Typography>
          </View>
          {featuredProducts.slice(0, 4).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="horizontal"
              index={i}
              onPress={() => handleProductPress(product.slug)}
            />
          ))}
          <Button
            title="View All Products"
            variant="outline"
            fullWidth
            onPress={() => router.push('/(tabs)/explore')}
            style={styles.viewAllButton}
          />
        </Animated.View>

        {/* Subscription — full-bleed editorial */}
        <Animated.View
          entering={FadeInUp.delay(480).springify().damping(31).mass(1).stiffness(100)}
          style={styles.subscriptionBlock}
        >
          <LinearGradient
            colors={['#3c4f28', '#5a7539']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Typography variant="h1" color="rgba(111,143,74,0.12)" style={styles.subscriptionBigNum}>
            15%
          </Typography>
          <View style={styles.subscriptionContent}>
            <View style={styles.subscriptionTag}>
              <Typography variant="caption" color={colors.secondary} weight="bold" style={{ letterSpacing: 2, fontSize: 9 }}>
                · SUBSCRIBE & SAVE ·
              </Typography>
            </View>
            <Typography variant="h3" color={colors.textInverse} style={styles.subscriptionTitle}>
              Never Run Out{'\n'}of Freshness
            </Typography>
            <Typography variant="bodySmall" color="rgba(255,255,255,0.55)" style={styles.subscriptionDesc}>
              Weekly deliveries tailored to your lifestyle. Save up to 15% on every order.
            </Typography>
            <View style={styles.subscriptionCTA}>
              <TouchableOpacity
                style={styles.subscriptionPillBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/subscriptions');
                }}
              >
                <Typography variant="bodySmall" color={colors.primaryDark} weight="bold">
                  View Plans
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/subscriptions')}
                style={styles.subscriptionGhostBtn}
              >
                <Typography variant="bodySmall" color="rgba(255,255,255,0.6)" weight="semibold">
                  Learn More
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Lifestyle Articles */}
        <Animated.View
          entering={FadeInUp.delay(520).springify().damping(31).mass(1).stiffness(100)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={colors.text}>Healthy Living</Typography>
            <TouchableOpacity style={styles.viewAll} onPress={() => router.push('/articles')}>
              <Typography variant="bodySmall" color={colors.primary} weight="semibold">View all</Typography>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.articleGrid}>
            {lifestyleArticles.slice(0, 2).map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/article/${article.id}`);
                }}
              >
                <View style={styles.articleImageContainer}>
                  <Image
                    source={resolveImageSource(article.image)}
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.articleCategoryPill}>
                    <Typography variant="caption" color={colors.secondary} weight="bold" style={{ fontSize: 9, letterSpacing: 1 }}>
                      {article.category.toUpperCase()}
                    </Typography>
                  </View>
                </View>
                <Typography variant="bodySmall" weight="bold" numberOfLines={2} style={styles.articleTitle}>
                  {article.title}
                </Typography>
                <View style={styles.articleMeta}>
                  <Typography variant="caption" color={colors.textTertiary}>
                    {article.readTime} read
                  </Typography>
                  <Ionicons name="arrow-forward" size={13} color={colors.primary} style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Testimonials */}
        <Animated.View
          entering={FadeInUp.delay(560).springify().damping(31).mass(1).stiffness(100)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color={colors.text}>What Customers Say</Typography>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {testimonials.map((testimonial) => (
              <View key={testimonial.id} style={styles.testimonialCard}>
                <Typography variant="h1" color={colors.primary} style={styles.quoteChar}>
                  "
                </Typography>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < testimonial.rating ? 'star' : 'star-outline'}
                      size={13}
                      color={colors.secondary}
                    />
                  ))}
                </View>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.testimonialText}>
                  {testimonial.content}
                </Typography>
                <View style={styles.testimonialAuthor}>
                  <View style={styles.authorAvatar}>
                    <Typography variant="caption" color={colors.primaryDark} weight="bold" style={{ fontSize: 13 }}>
                      {testimonial.name.charAt(0)}
                    </Typography>
                  </View>
                  <View>
                    <Typography variant="bodySmall" weight="bold" color={colors.textPrimary}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" color={colors.textTertiary}>
                      {testimonial.role}
                    </Typography>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Why Choose MiniGreens */}
        <Animated.View
          entering={FadeInUp.delay(600).springify().damping(31).mass(1).stiffness(100)}
          style={styles.section}
        >
          <Typography variant="h3" color={colors.text} style={{ marginBottom: spacing.lg }}>
            Why Choose MiniGreens
          </Typography>
          <View style={styles.whyGrid}>
            {whyChooseUs.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(600 + i * 70).springify().damping(31).mass(1).stiffness(100)}
                style={styles.whyCard}
              >
                <View style={styles.whyIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <Typography variant="bodySmall" weight="bold" style={{ marginBottom: spacing.xs }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {item.description}
                </Typography>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <FarmStorySection />
        <BusinessCTASection />

        {/* Footer */}
        <View style={styles.footer}>
          <Typography variant="bodySmall" color={colors.textTertiary} align="center">
            MiniGreens · {BRAND_CLAIM_SHORT}.
          </Typography>
          <Typography variant="caption" color={colors.textTertiary} align="center" style={{ marginTop: spacing.xs }}>
            © 2026 MiniGreens. All rights reserved.
          </Typography>
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
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 25,
    lineHeight: 30,
  },
  headerNameText: {
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  sectionSub: {
    marginTop: 2,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoCard: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    minHeight: 176,
    justifyContent: 'center',
  },
  promoText: {
    width: '62%',
    padding: spacing.lg,
    zIndex: 2,
  },
  promoBadges: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 3,
  },
  promoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  promoBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBadgeLabel: {
    fontSize: 10,
  },

  // ── Tea hero card (pale-green, cup on the right, benefit badges) ──
  heroWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  hero: {
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    minHeight: 186,
    backgroundColor: '#E4EECE',
    justifyContent: 'center',
  },
  heroText: {
    width: '60%',
    padding: spacing.lg,
    zIndex: 2,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroKicker: {
    letterSpacing: 1.4,
    fontSize: 8.5,
    marginBottom: 0,
  },
  heroRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    ...shadows.sm,
  },
  heroRatingText: {
    fontSize: 9.5,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  heroSub: {
    fontSize: 10.5,
    lineHeight: 14,
    marginBottom: spacing.md,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.pill,
  },
  heroBtnText: {
    fontSize: 10.5,
  },
  heroBadges: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 3,
  },
  heroBadge: {
    alignItems: 'center',
    width: 54,
  },
  heroBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadows.sm,
  },
  heroBadgeLabel: {
    fontSize: 8,
    lineHeight: 10,
  },
  brandName: {
    fontSize: 24,
    lineHeight: 28,
  },
  brandLeaf: {
    marginLeft: 6,
  },
  promoKicker: {
    letterSpacing: 1.2,
    fontSize: 8.5,
    marginBottom: spacing.xs,
  },
  promoTitle: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  promoDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: spacing.sm,
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  promoBtnText: {
    fontSize: 11,
  },
  promoImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '55%',
  },
  promoImageMask: {
    position: 'absolute',
    right: '45%',
    left: 0,
    top: 0,
    bottom: 0,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginTop: spacing.sectionGap,
    paddingHorizontal: spacing.lg,
  },
  categoriesRow: {
    marginTop: spacing['2xl'],
    paddingLeft: spacing.lg,
  },
  categorySkeletonWrap: {
    marginRight: spacing.lg,
    alignItems: 'center',
    width: 80,
  },
  seasonalGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.headingGap,
  },
  horizontalScroll: {
    paddingRight: spacing.lg,
  },
  // Seasonal dark block
  seasonalBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    padding: spacing['2xl'],
    minHeight: 200,
  },
  seasonalTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(111,143,74,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  seasonalTitle: {
    marginBottom: spacing.sm,
  },
  seasonalDesc: {
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  seasonalCta: {
    flexDirection: 'row',
  },
  seasonalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  viewAllButton: {
    marginTop: spacing.lg,
    borderColor: colors.borderSubtle,
  },
  // Subscription editorial block
  subscriptionBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    minHeight: 260,
    position: 'relative',
  },
  subscriptionBigNum: {
    position: 'absolute',
    top: -16,
    right: spacing.lg,
    fontSize: 96,
    lineHeight: 96,
    letterSpacing: -4,
  },
  subscriptionContent: {
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
  },
  subscriptionTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(111,143,74,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  subscriptionTitle: {
    marginBottom: spacing.sm,
  },
  subscriptionDesc: {
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  subscriptionCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subscriptionPillBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  subscriptionGhostBtn: {
    paddingVertical: spacing.md,
  },
  // Articles
  articleGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  articleCard: {
    flex: 1,
  },
  articleImageContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  articleImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
  },
  articleCategoryPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(6,19,13,0.75)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  articleTitle: {
    lineHeight: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  // Testimonials
  testimonialCard: {
    width: 280,
    marginRight: spacing.md,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    padding: spacing.xl,
    position: 'relative',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  quoteChar: {
    position: 'absolute',
    top: -8,
    left: spacing.md,
    fontSize: 72,
    lineHeight: 72,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  testimonialText: {
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  // Why grid
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  whyCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  whyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  footer: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  birthdayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  birthdayIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Trust strip ─────────────────────────────────────────────────────────
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  trustLabel: {
    fontSize: 10,
  },
  trustDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.xs,
  },
  // ── Live offers teaser ──────────────────────────────────────────────────
  offersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    ...shadows.sm,
  },
  offersIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
