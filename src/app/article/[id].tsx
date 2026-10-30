import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/ui/EmptyState';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/layout/Screen';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { lifestyleArticles } from '../../mock';
import { resolveImageSource } from '../../utils/placeholders';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const article = lifestyleArticles.find((a) => a.id === id || a.slug === id);

  if (!article) {
    return (
      <Screen title="Article" scroll={false}>
        <EmptyState
          icon="reader-outline"
          title="Article not found"
          message="This story may have been moved or removed."
          actionLabel="Back to stories"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const more = lifestyleArticles.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <Screen title={article.category}>
      {/* Hero image */}
      <Animated.View entering={FadeInUp.springify().damping(34).mass(1).stiffness(100)} style={styles.heroWrap}>
        <Image source={resolveImageSource(article.image)} style={styles.heroImage} contentFit="cover" />
        <LinearGradient
          colors={['rgba(29,43,32,0)', 'rgba(29,43,32,0.82)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.heroText}>
          <View style={styles.categoryPill}>
            <Typography variant="caption" color={colors.textInverse} weight="bold" style={styles.categoryPillText}>
              {article.category.toUpperCase()}
            </Typography>
          </View>
          <Typography variant="h3" color={colors.textInverse} style={styles.title}>
            {article.title}
          </Typography>
        </View>
      </Animated.View>

      {/* Byline */}
      <View style={styles.byline}>
        <View style={styles.avatar}>
          <Typography variant="bodySmall" weight="bold" color={colors.primaryDark}>
            {article.author.charAt(0)}
          </Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="bodySmall" weight="semibold" color={colors.text}>
            {article.author}
          </Typography>
          <Typography variant="caption" color={colors.textTertiary}>
            {formatDate(article.publishedAt)} · {article.readTime} read
          </Typography>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Body */}
      <View style={styles.body}>
        {article.content.map((block, i) => (
          <View key={i}>
            {!!block.heading && (
              <Typography variant="body" weight="bold" color={colors.text} style={styles.blockHeading}>
                {block.heading}
              </Typography>
            )}
            <Typography variant="body" color={colors.textSecondary} style={styles.paragraph}>
              {block.body}
            </Typography>
          </View>
        ))}
      </View>

      {/* More reads */}
      {more.length > 0 && (
        <View style={styles.moreSection}>
          <SectionHeader title="More reads" />
          {more.map((a) => (
            <PressableScale
              key={a.id}
              haptic={false}
              style={styles.moreRow}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/article/${a.id}`);
              }}
              accessibilityLabel={a.title}
            >
              <Image source={resolveImageSource(a.image)} style={styles.moreThumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color={colors.primary} weight="semibold" uppercase>
                  {a.category}
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color={colors.text} numberOfLines={2}>
                  {a.title}
                </Typography>
                <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                  {a.readTime} read
                </Typography>
              </View>
            </PressableScale>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    height: 240,
    borderRadius: borderRadius.cardLarge,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroText: {
    padding: spacing.lg,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.sm,
  },
  categoryPillText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    lineHeight: 30,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },
  body: {
    paddingTop: spacing.lg,
  },
  blockHeading: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  paragraph: {
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  moreSection: {
    marginTop: spacing.sectionGap,
  },
  moreRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  moreThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
  },
});
