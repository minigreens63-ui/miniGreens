import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../../theme';
import { resolveImageSource } from '../../utils/placeholders';
import { Typography } from '../../components/ui/Typography';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { useCategory, useProducts } from '../../services/catalog';

export default function CategoryScreen() {
  const params = useLocalSearchParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const { category, isLoading: categoryLoading } = useCategory(slug);
  const { products, isLoading: productsLoading } = useProducts();
  const categoryProducts = products.filter((p) => p.categoryId === category?.id);

  if (categoryLoading || productsLoading) {
    return (
      <Screen title="Category">
        <Skeleton width="100%" height={190} borderRadiusVal={borderRadius.cardLarge} />
        <View style={styles.productGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.productWrapper}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  if (!category) {
    return (
      <Screen title="Category" scroll={false}>
        <EmptyState
          icon="folder-open-outline"
          title="Category Not Found"
          message="The category you're looking for doesn't exist."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen title={category.name}>
      {/* Category hero: a rounded card, like Home's hero */}
      <Animated.View entering={FadeInUp.delay(60).springify().damping(34).mass(1).stiffness(100)}>
        <View style={styles.hero}>
          <Image source={resolveImageSource(category.image)} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(29,43,32,0.78)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.25 }}
            end={{ x: 0, y: 1 }}
          />
          <Animated.View
            entering={FadeInUp.delay(160).springify().damping(31).mass(1).stiffness(100)}
            style={styles.heroContent}
          >
            <Typography variant="h3" color={colors.textInverse}>
              {category.name}
            </Typography>
            {category.description ? (
              <Typography variant="bodySmall" color="rgba(255,255,255,0.85)" style={styles.heroDesc} numberOfLines={2}>
                {category.description}
              </Typography>
            ) : null}
            <View style={styles.countPill}>
              <Ionicons name="leaf" size={12} color={colors.textInverse} />
              <Typography variant="caption" color={colors.textInverse} weight="semibold" style={{ marginLeft: 4 }}>
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
              </Typography>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Products */}
      <View style={styles.productGrid}>
        {categoryProducts.map((product, i) => (
          <Animated.View
            key={product.id}
            entering={FadeInUp.delay(200 + i * 60).springify().damping(31).mass(1).stiffness(100)}
            style={styles.productWrapper}
          >
            <ProductCard
              product={product}
              index={i}
              onPress={() => router.push(`/product/${product.slug}`)}
              style={styles.gridCard}
            />
          </Animated.View>
        ))}
      </View>

      {categoryProducts.length === 0 && (
        <EmptyState icon="basket-outline" title="No Products Yet" message="This category will have products soon." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 190,
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDark,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  heroDesc: {
    marginTop: spacing.xs,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    marginTop: spacing.sm,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sectionGap / 2,
  },
  productWrapper: {
    width: '48%',
    marginBottom: spacing.md,
  },
  gridCard: {
    width: '100%',
    marginRight: 0,
  },
});
