import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/layout/Screen';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

// Plan "includes" line icon — a quiet visual cue per item type, picked by keyword.
function includeIcon(item: string): keyof typeof Ionicons.glyphMap {
  const s = item.toLowerCase();
  if (s.includes('juice')) return 'nutrition-outline';
  if (s.includes('salad')) return 'restaurant-outline';
  if (s.includes('tea')) return 'cafe-outline';
  if (s.includes('delivery')) return 'bicycle-outline';
  if (s.includes('microgreen') || s.includes('green')) return 'leaf';
  return 'leaf';
}

function PlanFlourish() {
  return (
    <View pointerEvents="none" style={styles.headerFlourish}>
      <Ionicons name="leaf" size={70} color={colors.green[200]} style={styles.flourishLeafBack} />
      <Ionicons name="leaf" size={48} color={colors.primaryLight} style={styles.flourishLeafFront} />
    </View>
  );
}

export default function SubscriptionsScreen() {
  const session = useAuthStore((s) => s.session);

  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
    if (planError) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setPlans(planData ?? []);

    if (session) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();
      setActiveSubscription(subData ?? null);
    } else {
      setActiveSubscription(null);
    }
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubscribe = async (plan: SubscriptionPlanRow) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (activeSubscription) {
      router.push('/subscription/manage');
      return;
    }
    router.push({ pathname: '/subscription/plan', params: { planId: plan.id } });
  };

  if (loading) {
    return (
      <Screen title="Subscriptions" subtitle="Fresh on a schedule. Skip or cancel anytime." largeTitle showBack={false} hasTabBar>
        {[0, 1].map((i) => (
          <Card key={i} style={styles.planCard} padding="xl">
            <Skeleton width="45%" height={18} />
            <Skeleton width="80%" height={12} style={{ marginTop: spacing.sm }} />
            <Skeleton width="60%" height={12} style={{ marginTop: spacing.xl }} />
            <Skeleton width="100%" height={48} borderRadiusVal={borderRadius.control} style={{ marginTop: spacing.xl }} />
          </Card>
        ))}
      </Screen>
    );
  }

  return (
    <Screen showBack={false} hasTabBar>
      <View style={styles.header}>
        <PlanFlourish />
        <Typography variant="label" color={colors.accentSoft}>Plans</Typography>
        <Typography variant="h2" color={colors.text}>Subscriptions</Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.headerSubtitle}>
          Fresh on a schedule. Skip or cancel anytime.
        </Typography>
      </View>

      <ErrorNotice message={subscribeError} onDismiss={() => setSubscribeError(null)} />
      {loadError && (
        <ErrorNotice
          message="Couldn't load subscription plans. Check your connection and try again."
          onDismiss={() => setLoadError(false)}
        />
      )}

      {activeSubscription && (
        <Animated.View entering={FadeInUp.delay(80).springify().damping(31).mass(1).stiffness(100)}>
          <PressableScale onPress={() => router.push('/subscription/manage')} accessibilityLabel="Manage my subscription">
            <View style={styles.activeBanner}>
              <View style={styles.activeIcon}>
                <Ionicons name="calendar" size={20} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="bold" color={colors.text}>
                  You have an active subscription
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  Skip a delivery, change items or cancel.
                </Typography>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </PressableScale>
        </Animated.View>
      )}

        {/* Plans */}
        {plans.map((plan, i) => {
          const isCurrentPlan = !!activeSubscription && activeSubscription.plan_id === plan.id;
          return (
            <Animated.View
              key={plan.id}
              entering={FadeInUp.delay(180 + i * 100).springify().damping(31).mass(1).stiffness(100)}
            >
              <Card
                style={[styles.planCard, plan.is_popular && styles.popularCard].filter(Boolean) as any}
                padding="xl"
                pressable
              >
                <View pointerEvents="none" style={styles.planFlourish}>
                  <Ionicons name="leaf" size={64} color={colors.green[100]} style={styles.planFlourishLeaf} />
                </View>

                {plan.is_popular && (
                  <Animated.View
                    entering={ZoomIn.delay(280 + i * 100).springify().damping(19).mass(1).stiffness(100)}
                    style={styles.popularBadge}
                  >
                    <Typography variant="caption" color={colors.textInverse} weight="bold">
                      MOST POPULAR
                    </Typography>
                  </Animated.View>
                )}

                {isCurrentPlan && (
                  <Typography variant="label" color={colors.accentSoft} style={styles.yourPlanBadge}>
                    Your Plan
                  </Typography>
                )}

                <View style={[styles.planHeader, (plan.is_popular || isCurrentPlan) && styles.planHeaderPopular]}>
                  <View style={styles.planHeaderInfo}>
                    <Typography variant="h3" color={colors.text}>
                      {plan.name}
                    </Typography>
                    <Typography variant="bodySmall" color={colors.textSecondary} style={styles.planDescription}>
                      {plan.description}
                    </Typography>
                  </View>
                  <View style={styles.planPrice}>
                    <Typography variant="h3" color={colors.accent} weight="bold">
                      ₹{plan.price}
                    </Typography>
                    <Typography variant="caption" color={colors.textSecondary}>
                      /{plan.unit}
                    </Typography>
                  </View>
                </View>

                <Typography variant="label" color={colors.textTertiary} style={styles.includesLabel}>
                  Includes
                </Typography>
                {plan.items.map((item, index) => (
                  <View key={index} style={styles.planItem}>
                    <View style={styles.planItemIconBg}>
                      <Ionicons name={includeIcon(item)} size={14} color={colors.primary} />
                    </View>
                    <Typography variant="bodySmall" color={colors.textSecondary} style={styles.planItemText}>
                      {item}
                    </Typography>
                  </View>
                ))}

                <View style={styles.planDivider} />

                <View style={styles.planBenefits}>
                  {plan.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefit}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Typography variant="bodySmall" color={colors.textSecondary} style={styles.benefitText}>
                        {benefit}
                      </Typography>
                    </View>
                  ))}
                </View>

                <PressableScale
                  style={styles.manageButton}
                  onPress={() => handleSubscribe(plan)}
                  haptic={false}
                  accessibilityLabel={activeSubscription ? 'Manage subscription' : `Get started with ${plan.name}`}
                >
                  <Ionicons
                    name={activeSubscription ? 'settings-outline' : 'arrow-forward-circle-outline'}
                    size={18}
                    color={colors.onAccent}
                  />
                  <Typography variant="body" weight="semibold" color={colors.onAccent} style={styles.manageButtonLabel}>
                    {activeSubscription ? 'Manage Subscription' : 'Get Started'}
                  </Typography>
                  <Ionicons name="chevron-forward" size={18} color={colors.onAccent} />
                </PressableScale>
              </Card>
            </Animated.View>
          );
        })}

        {/* Build your own */}
        <Animated.View
          entering={FadeInUp.delay(400).springify().damping(31).mass(1).stiffness(100)}
        >
          <Card style={styles.buildOwnCard} variant="outlined" padding="xl">
            <Typography variant="body" weight="semibold" color={colors.text}>
              Don&apos;t see a fit?
            </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.inquiryText}>
              Build your own subscription — pick your products, quantities, and weekly or monthly delivery.
            </Typography>
            <Button
              title="Build Your Own"
              variant="outline"
              fullWidth
              onPress={() => {
                if (!session) {
                  router.push('/auth/login');
                  return;
                }
                router.push('/subscription/custom');
              }}
            />
          </Card>
        </Animated.View>

        {/* Inquiry */}
        <Animated.View
          entering={FadeInUp.delay(480).springify().damping(31).mass(1).stiffness(100)}
        >
          <Card style={styles.inquiryCard} variant="outlined" padding="xl">
            <Typography variant="body" weight="semibold" color={colors.text} align="center">
              Have Questions?
            </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary} align="center" style={styles.inquiryText}>
              We will help you find the perfect plan for your lifestyle.
            </Typography>
            <Button
              title="Contact Us"
              variant="primary"
              fullWidth
              onPress={() => router.push('/profile/contact')}
            />
          </Card>
        </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  headerSubtitle: {
    marginTop: 4,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.accentSurface,
  },
  activeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  planCard: {
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  planFlourish: {
    position: 'absolute',
    top: -16,
    right: -16,
  },
  planFlourishLeaf: {
    opacity: 0.35,
    transform: [{ rotate: '22deg' }],
  },
  yourPlanBadge: {
    marginBottom: spacing.xs,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planHeaderPopular: {
    marginTop: spacing.xl,
  },
  planHeaderInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  planDescription: {
    marginTop: 2,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  planDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  includesLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planItemIconBg: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planItemText: {
    marginLeft: spacing.sm,
  },
  planBenefits: {
    marginTop: spacing.xs,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    marginLeft: spacing.sm,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  manageButtonLabel: {
    marginHorizontal: spacing.sm,
  },
  buildOwnCard: {
    marginTop: spacing.lg,
  },
  inquiryCard: {
    marginTop: spacing.lg,
  },
  inquiryText: {
    marginVertical: spacing.lg,
  },
});
