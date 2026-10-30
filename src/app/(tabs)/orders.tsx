import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { PressableScale } from '../../components/ui/PressableScale';
import { StatusPill } from '../../components/ui/StatusPill';
import { Screen } from '../../components/layout/Screen';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';
import type { Database, OrderStatus, PaymentStatus } from '../../types/database';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };

const MAX_ITEMS_SHOWN = 3;

const paymentLabel: Record<PaymentStatus, string> = {
  pending: 'Pay on delivery',
  paid: 'Paid',
  failed: 'Payment failed',
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type FilterKey = 'all' | 'processing' | 'shipped' | 'delivered';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const matchesFilter = (status: OrderStatus, filter: FilterKey) => {
  if (filter === 'all') return true;
  if (filter === 'processing') return status === 'processing' || status === 'pending' || status === 'confirmed';
  return status === filter;
};

// ─── Decorative header ────────────────────────────────────────────────────────

function LeafFlourish() {
  return (
    <View pointerEvents="none" style={styles.flourish}>
      <Ionicons name="leaf" size={64} color={colors.green[200]} style={styles.flourishLeafBack} />
      <Ionicons name="leaf" size={44} color={colors.primaryLight} style={styles.flourishLeafFront} />
    </View>
  );
}

function OrdersHeader() {
  return (
    <View style={styles.header}>
      <LeafFlourish />
      <View style={styles.headerAvatar}>
        <Ionicons name="leaf" size={22} color={colors.primary} />
      </View>
      <Typography variant="h2" color={colors.text} style={styles.headerTitle}>
        Orders
      </Typography>
      <Typography variant="body" color={colors.textSecondary}>
        Track everything you have ordered.
      </Typography>
    </View>
  );
}

function FilterChips({ value, onChange }: { value: FilterKey; onChange: (key: FilterKey) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      style={styles.chipsScroll}
    >
      {FILTERS.map((f) => {
        const active = f.key === value;
        return (
          <PressableScale
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityLabel={f.label}
          >
            <Typography
              variant="bodySmall"
              weight="semibold"
              color={active ? colors.onAccent : colors.textSecondary}
            >
              {f.label}
            </Typography>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, index }: { order: OrderWithItems; index: number }) {
  const shown = order.order_items.slice(0, MAX_ITEMS_SHOWN);
  const hidden = order.order_items.length - shown.length;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify().damping(31).mass(1).stiffness(100)}
      style={styles.cardWrap}
    >
      <PressableScale onPress={() => router.push(`/order/${order.id}`)} accessibilityLabel={`Order ${order.order_number}`}>
        <Card padding="lg" style={styles.card}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <View style={styles.orderHeaderTitleRow}>
                <Typography variant="h4" color={colors.text}>
                  {order.order_number}
                </Typography>
                {order.order_type === 'preorder' && (
                  <View style={styles.preorderPill}>
                    <Typography variant="caption" weight="bold" color={colors.primaryDark} style={{ fontSize: 9, letterSpacing: 0.5 }}>
                      PRE-ORDER
                    </Typography>
                  </View>
                )}
              </View>
              <Typography variant="caption" color={colors.textTertiary}>
                Placed on {formatDate(order.created_at)}
              </Typography>
            </View>
            <View style={styles.orderHeaderRight}>
              <StatusPill label={order.status} status={order.status} />
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </View>

          <View style={styles.orderItems}>
            {shown.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                {item.image ? (
                  <Image
                    source={resolveImageSource(item.image)}
                    style={styles.orderItemImage}
                    contentFit="cover"
                  />
                ) : (
                  <PlaceholderImage label={item.product_name} style={styles.orderItemImage} />
                )}
                <View style={styles.orderItemInfo}>
                  <Typography variant="body" weight="semibold" numberOfLines={1}>
                    {item.product_name}
                  </Typography>
                  <Typography variant="bodySmall" color={colors.textTertiary}>
                    Qty {item.quantity} × ₹{item.price.toFixed(2)}
                  </Typography>
                </View>
              </View>
            ))}
            {hidden > 0 ? (
              <Typography variant="caption" color={colors.textTertiary} style={styles.more}>
                +{hidden} more {hidden === 1 ? 'item' : 'items'}
              </Typography>
            ) : null}
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.orderFooterLeft}>
              <View style={styles.deliveryIcon}>
                <Ionicons name="cube-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Typography variant="bodySmall" color={colors.textSecondary}>
                  {formatDate(order.created_at)}
                </Typography>
                <Typography variant="caption" color={colors.textTertiary}>
                  {paymentLabel[order.payment_status]}
                </Typography>
              </View>
            </View>
            <View style={styles.pricePill}>
              <Typography variant="body" weight="bold" color={colors.primaryDark}>
                ₹{order.total.toFixed(2)}
              </Typography>
              <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
            </View>
          </View>

          {order.expected_availability_date && (
            <Typography variant="caption" color={colors.primaryDark} weight="semibold" style={styles.expected}>
              Expected {formatDate(order.expected_availability_date)}
            </Typography>
          )}
        </Card>
      </PressableScale>
    </Animated.View>
  );
}

function OrderCardSkeleton({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify().damping(31).mass(1).stiffness(100)}
      style={styles.cardWrap}
    >
      <Card padding="lg" style={styles.card}>
        <View style={styles.orderHeader}>
          <Skeleton width={110} height={14} />
          <Skeleton width={72} height={22} borderRadiusVal={borderRadius.pill} />
        </View>
        <View style={styles.orderItem}>
          <Skeleton width={64} height={64} borderRadiusVal={borderRadius.md} />
          <View style={[styles.orderItemInfo, { marginLeft: spacing.md }]}>
            <Skeleton width="65%" height={13} />
            <Skeleton width="40%" height={11} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
        <View style={styles.orderFooter}>
          <Skeleton width={90} height={13} />
          <Skeleton width={60} height={16} />
        </View>
      </Card>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const insets = useSafeAreaInsets();

  const load = useCallback(() => {
    if (!profile) return () => {};
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('profile_id', profile.id)
      // Business orders placed via the partner flow are fulfilled through
      // Admin and have no self-serve payment, so keep them out of the
      // customer Orders tab (BUG-05).
      .neq('order_type', 'business')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(true);
          setLoading(false);
          return;
        }
        setOrders((data as OrderWithItems[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useFocusEffect(load);

  const filteredOrders = useMemo(
    () => orders.filter((o) => matchesFilter(o.status, filter)),
    [orders, filter]
  );

  // Signed out: there is nothing to load, so don't leave the spinner running.
  if (!session && !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <OrdersHeader />
        <EmptyState
          icon="receipt-outline"
          title="Log in to see your orders"
          message="Your order history and delivery status show up here."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </View>
    );
  }

  const isEmpty = !loading && filteredOrders.length === 0;

  return (
    <Screen scroll showBack={false} hasTabBar contentContainerStyle={styles.screenContent}>
      <OrdersHeader />
      <FilterChips value={filter} onChange={setFilter} />
      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <OrderCardSkeleton key={i} index={i} />
          ))}
        </View>
      ) : loadError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load your orders"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={load}
        />
      ) : isEmpty ? (
        <EmptyState
          icon="receipt-outline"
          title="No Orders Yet"
          message={filter === 'all' ? 'Your order history will appear here.' : `You have no ${filter} orders right now.`}
          actionLabel="Start Shopping"
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <View style={styles.list}>
          {filteredOrders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screenContent: {
    paddingTop: 0,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  flourish: {
    position: 'absolute',
    top: -8,
    right: -10,
    width: 110,
    height: 110,
  },
  flourishLeafBack: {
    position: 'absolute',
    top: 4,
    right: 0,
    opacity: 0.55,
    transform: [{ rotate: '18deg' }],
  },
  flourishLeafFront: {
    position: 'absolute',
    top: 38,
    right: 36,
    opacity: 0.6,
    transform: [{ rotate: '-12deg' }],
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  chipsScroll: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  list: {
    paddingTop: spacing.xs,
  },
  cardWrap: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.card,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preorderPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryBg,
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderItemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    marginRight: spacing.md,
  },
  orderItemInfo: {
    flex: 1,
  },
  more: {
    marginBottom: spacing.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  orderFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
  },
  expected: {
    marginTop: spacing.sm,
  },
});
