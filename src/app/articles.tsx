import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Typography } from '../components/ui/Typography';
import { PressableScale } from '../components/ui/PressableScale';
import { Screen } from '../components/layout/Screen';
import { lifestyleArticles } from '../mock';
import { resolveImageSource } from '../utils/placeholders';

export default function ArticlesScreen() {
  return (
    <Screen title="Healthy Living">
      <Typography variant="bodySmall" color={colors.textSecondary} style={styles.intro}>
        Stories on nutrition, sustainability and feeling good.
      </Typography>
      {lifestyleArticles.map((article, i) => (
        <Animated.View
          key={article.id}
          entering={FadeInUp.delay(i * 80).springify().damping(31).mass(1).stiffness(100)}
          style={styles.cardWrap}
        >
          <PressableScale
            haptic={false}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/article/${article.id}`);
            }}
            accessibilityLabel={article.title}
          >
            <View style={styles.card}>
              <Image source={resolveImageSource(article.image)} style={styles.image} contentFit="cover" />
              <View style={styles.cardBody}>
                <View style={styles.pill}>
                  <Typography variant="caption" color={colors.primaryDark} weight="bold" style={styles.pillText}>
                    {article.category.toUpperCase()}
                  </Typography>
                </View>
                <Typography variant="body" weight="bold" color={colors.text} numberOfLines={2} style={styles.cardTitle}>
                  {article.title}
                </Typography>
                <Typography variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.excerpt}>
                  {article.excerpt}
                </Typography>
                <View style={styles.meta}>
                  <Typography variant="caption" color={colors.textTertiary}>
                    {article.readTime} read
                  </Typography>
                  <Ionicons name="arrow-forward" size={13} color={colors.primary} style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.lg,
  },
  cardWrap: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: colors.surfaceVariant,
  },
  cardBody: {
    padding: spacing.lg,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSurface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.sm,
  },
  pillText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  cardTitle: {
    lineHeight: 22,
  },
  excerpt: {
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
