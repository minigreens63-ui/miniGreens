import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { Screen } from '../../components/layout/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'] & {
  subscription_plans: Database['public']['Tables']['subscription_plans']['Row'] | null;
  subscription_items: { quantity: number; products: { name: string; price: number } | null }[];
};

function planName(s: SubscriptionRow): string {
  if (!s.is_custom) return s.subscription_plans?.name ?? 'Subscription';
  return `Custom (${s.custom_frequency === 'monthly' ? 'Monthly' : 'Weekly'})`;
}

function planPrice(s: SubscriptionRow): number {
  if (!s.is_custom) return Number(s.subscription_plans?.price ?? 0);
  return s.subscription_items.reduce(
    (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
    0
  );
}

function planUnit(s: SubscriptionRow): string {
  if (!s.is_custom) return s.subscription_plans?.unit ?? '';
  return s.custom_frequency === 'monthly' ? 'month' : 'week';
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  active: colors.success,
  paused: colors.warning,
  cancelled: colors.error,
};

export default function ManageSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);

  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*), subscription_items(quantity, products(name, price))')
      .eq('profile_id', session.user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as unknown as SubscriptionRow) ?? null);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePause = async () => {
    if (!subscription) return;
    setUpdating(true);
    setActionError(null);
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', subscription.id);
    if (error) {
      setActionError("Couldn't pause your subscription. Please try again.");
      setUpdating(false);
      return;
    }
    await load();
    setUpdating(false);
  };

  const handleResume = async () => {
    if (!subscription) return;
    setUpdating(true);
    setActionError(null);
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active', paused_at: null })
      .eq('id', subscription.id);
    if (error) {
      setActionError("Couldn't resume your subscription. Please try again.");
      setUpdating(false);
      return;
    }
    await load();
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!subscription) return;
    setUpdating(true);
    setActionError(null);
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscription.id);
    if (error) {
      setActionError("Couldn't cancel your subscription. Please try again.");
      setUpdating(false);
      return;
    }
    await load();
    setUpdating(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (!session) {
    return (
      <Screen title="My Subscription" scroll={false}>
        <EmptyState
          icon="calendar-outline"
          title="Log in to manage your subscription"
          message="Your plan, next delivery and pause or cancel options show up here."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  if (!subscription) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Typography variant="h3" color={colors.text} style={styles.emptyTitle}>
          No subscription yet
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.emptySubtitle}>
          Browse our subscription plans and never miss freshness.
        </Typography>
        <Button title="Browse Plans" onPress={() => router.replace('/(tabs)/subscriptions')} size="lg" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" color={colors.text}>
            My Subscription
          </Typography>
          <View style={{ width: 24 }} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(31).mass(1).stiffness(100)}>
          <Card padding="xl" style={styles.planCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[subscription.status] }]} />
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {STATUS_LABELS[subscription.status]}
              </Typography>
            </View>
            <Typography variant="h3" color={colors.text} style={styles.planName}>
              {planName(subscription)}
            </Typography>
            <Typography variant="body" color={colors.textSecondary}>
              {subscription.is_custom
                ? subscription.subscription_items
                    .map((item) => `${item.products?.name ?? 'Item'} × ${item.quantity}`)
                    .join(', ')
                : subscription.subscription_plans?.description}
            </Typography>
            <View style={styles.priceRow}>
              <Typography variant="h2" color={colors.primaryDark}>
                ₹{planPrice(subscription)}
              </Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                /{planUnit(subscription)}
              </Typography>
            </View>
            {subscription.next_delivery_date && (
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.nextDelivery}>
                Next delivery: {subscription.next_delivery_date}
              </Typography>
            )}
          </Card>
        </Animated.View>

        {actionError && (
          <ErrorNotice message={actionError} onDismiss={() => setActionError(null)} style={{ marginBottom: spacing.lg }} />
        )}

        <Animated.View entering={FadeInUp.delay(180).springify().damping(31).mass(1).stiffness(100)} style={styles.actions}>
          {subscription.status === 'active' && (
            <Button title="Pause Subscription" variant="outline" fullWidth loading={updating} onPress={handlePause} />
          )}
          {subscription.status === 'paused' && (
            <Button title="Resume Subscription" fullWidth loading={updating} onPress={handleResume} />
          )}
          {subscription.status !== 'cancelled' && (
            <Button
              title="Cancel Subscription"
              variant="outline"
              fullWidth
              loading={updating}
              onPress={handleCancel}
              style={styles.cancelButton}
            />
          )}
          {subscription.status === 'cancelled' && (
            <Button title="Browse Plans" fullWidth onPress={() => router.replace('/(tabs)/subscriptions')} />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scrollContent: {
    padding: spacing['2xl'],
    paddingBottom: spacing['6xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  planCard: {
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  planName: {
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.lg,
  },
  nextDelivery: {
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  cancelButton: {
    borderColor: colors.error,
  },
});
