import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';
import type { Database, OrderStatus, PaymentStatus } from '../../types/database';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type AddressRow = Database['public']['Tables']['addresses']['Row'];
type OrderDetail = OrderRow & { order_items: OrderItemRow[]; addresses: AddressRow | null };

const statusColors: Record<OrderStatus, string> = {
  pending: colors.warning,
  confirmed: colors.info,
  processing: colors.info,
  shipped: colors.primary,
  delivered: colors.success,
  cancelled: colors.error,
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: colors.warning,
  paid: colors.success,
  failed: colors.error,
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusSteps: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Your order has been confirmed' },
  { key: 'processing', label: 'Processing', desc: 'Preparing your greens' },
  { key: 'shipped', label: 'Shipped', desc: 'On the way to you' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your fresh greens!' },
];

// ─── Animated Tracker Item ────────────────────────────────────────────────────

function TrackerItem({
  step,
  isCompleted,
  isCurrent,
  isLast,
  delay,
}: {
  step: (typeof statusSteps)[0];
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  delay: number;
}) {
  const lineHeight = useSharedValue(0);

  useEffect(() => {
    if (isCompleted && !isLast) {
      lineHeight.value = withDelay(delay + 120, withTiming(1, { duration: 400 }));
    }
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    flex: lineHeight.value,
    minHeight: lineHeight.value * 40,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(31).mass(1).stiffness(100)}
      style={styles.trackerItem}
    >
      <View style={styles.trackerLine}>
        <Animated.View
          entering={ZoomIn.delay(delay + 60).springify().damping(19).mass(1).stiffness(100)}
          style={[
            styles.trackerDot,
            isCompleted && styles.trackerDotActive,
            isCurrent && styles.trackerDotCurrent,
          ]}
        >
          {isCompleted && !isCurrent && (
            <Ionicons name="checkmark" size={8} color={colors.textInverse} />
          )}
        </Animated.View>
        {!isLast && (
          <View style={styles.trackerLineTrack}>
            {isCompleted && <Animated.View style={[styles.trackerLineFill, lineStyle]} />}
          </View>
        )}
      </View>
      <View style={styles.trackerContent}>
        <Typography
          variant="bodySmall"
          weight={isCompleted ? 'semibold' : 'regular'}
          color={isCompleted ? colors.text : colors.textTertiary}
        >
          {step.label}
        </Typography>
        {isCompleted && (
          <Typography variant="caption" color={colors.textSecondary}>
            {step.desc}
          </Typography>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('orders')
      .select('*, order_items(*), addresses(*)')
      .eq('id', id as string)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderDetail | null);
        setLoading(false);
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textTertiary} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={100} borderRadiusVal={borderRadius.lg} />
          <Skeleton width="100%" height={140} borderRadiusVal={borderRadius.lg} style={{ marginTop: spacing.lg }} />
          <Skeleton width="100%" height={90} borderRadiusVal={borderRadius.lg} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Typography variant="h4" color={colors.text}>Order not found</Typography>
          <Button title="Go Back" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </View>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.headerButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="body" weight="semibold">Order Details</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Header */}
        <Animated.View entering={FadeInUp.delay(60).springify().damping(31).mass(1).stiffness(100)}>
          <Card padding="lg" style={styles.orderHeaderCard}>
            <View style={styles.orderInfoRow}>
              <Typography variant="bodySmall" color={colors.textTertiary}>Order Number</Typography>
              <Typography variant="bodySmall" weight="semibold">{order.order_number}</Typography>
            </View>
            <View style={styles.orderInfoRow}>
              <Typography variant="bodySmall" color={colors.textTertiary}>Placed on</Typography>
              <Typography variant="bodySmall" weight="semibold">{formatDate(order.created_at)}</Typography>
            </View>
            {order.order_type === 'preorder' && (
              <View style={styles.orderInfoRow}>
                <Typography variant="bodySmall" color={colors.textTertiary}>Type</Typography>
                <Typography variant="bodySmall" weight="semibold">Pre-order</Typography>
              </View>
            )}
            {order.expected_availability_date && (
              <View style={styles.orderInfoRow}>
                <Typography variant="bodySmall" color={colors.textTertiary}>Expected availability</Typography>
                <Typography variant="bodySmall" weight="semibold">{formatDate(order.expected_availability_date)}</Typography>
              </View>
            )}
            <View style={styles.orderInfoRow}>
              <Typography variant="bodySmall" color={colors.textTertiary}>Status</Typography>
              <Animated.View
                entering={ZoomIn.delay(160).springify().damping(19).mass(1).stiffness(100)}
                style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}
              >
                <Typography variant="caption" weight="semibold" color={statusColors[order.status]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Typography>
              </Animated.View>
            </View>
            <View style={styles.orderInfoRow}>
              <Typography variant="bodySmall" color={colors.textTertiary}>Payment</Typography>
              <Animated.View
                entering={ZoomIn.delay(180).springify().damping(19).mass(1).stiffness(100)}
                style={[styles.statusBadge, { backgroundColor: paymentStatusColors[order.payment_status] + '20' }]}
              >
                <Typography variant="caption" weight="semibold" color={paymentStatusColors[order.payment_status]}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </Typography>
              </Animated.View>
            </View>
          </Card>
        </Animated.View>

        {/* Status Tracker */}
        {order.status !== 'cancelled' && (
          <Animated.View entering={FadeInUp.delay(140).springify().damping(31).mass(1).stiffness(100)}>
            <Card padding="lg" style={styles.trackerCard}>
              {statusSteps.map((step, index) => (
                <TrackerItem
                  key={step.key}
                  step={step}
                  isCompleted={index <= currentStatusIndex}
                  isCurrent={index === currentStatusIndex}
                  isLast={index === statusSteps.length - 1}
                  delay={220 + index * 80}
                />
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Items */}
        <Animated.View entering={FadeInUp.delay(420).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="bodySmall" weight="semibold" color={colors.textTertiary} uppercase style={styles.sectionLabel}>
            Items
          </Typography>
        </Animated.View>
        {order.order_items.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInUp.delay(460 + index * 70).springify().damping(31).mass(1).stiffness(100)}
          >
            <Card variant="outlined" padding="lg" style={styles.itemCard}>
              <View style={styles.itemRow}>
                {item.image ? (
                  <Image
                    source={resolveImageSource(item.image)}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                ) : (
                  <PlaceholderImage label={item.product_name} style={styles.itemImage} />
                )}
                <View style={styles.itemInfo}>
                  <Typography variant="bodySmall" weight="semibold">{item.product_name}</Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                  </Typography>
                </View>
                <Typography variant="bodySmall" weight="bold" color={colors.accent}>
                  ₹{(item.quantity * item.price).toFixed(2)}
                </Typography>
              </View>
            </Card>
          </Animated.View>
        ))}

        {/* Payment Summary */}
        <Animated.View entering={FadeInUp.delay(560).springify().damping(31).mass(1).stiffness(100)}>
          <Card variant="outlined" padding="lg" style={styles.summaryCard}>
            <Typography variant="bodySmall" weight="semibold" style={styles.summaryTitle}>
              Payment Summary
            </Typography>
            <View style={styles.summaryRow}>
              <Typography variant="bodySmall" color={colors.textSecondary}>Subtotal</Typography>
              <Typography variant="bodySmall">₹{order.subtotal.toFixed(2)}</Typography>
            </View>
            <View style={styles.summaryRow}>
              <Typography variant="bodySmall" color={colors.textSecondary}>Delivery Fee</Typography>
              <Typography variant="bodySmall">₹{order.delivery_fee.toFixed(2)}</Typography>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Typography variant="bodySmall" weight="bold">Total</Typography>
              <Typography variant="body" weight="bold" color={colors.accent}>
                ₹{order.total.toFixed(2)}
              </Typography>
            </View>
          </Card>
        </Animated.View>

        {/* Delivery Address */}
        {order.addresses && (
          <Animated.View entering={FadeInUp.delay(620).springify().damping(31).mass(1).stiffness(100)}>
            <Typography variant="bodySmall" weight="semibold" color={colors.textTertiary} uppercase style={styles.sectionLabel}>
              Delivery Address
            </Typography>
            <Card variant="outlined" padding="lg" style={styles.addressCard}>
              <Typography variant="bodySmall" weight="semibold">{order.addresses.full_name}</Typography>
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {order.addresses.street}
              </Typography>
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {order.addresses.city}, {order.addresses.state} {order.addresses.zip_code}
              </Typography>
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {order.addresses.phone}
              </Typography>
            </Card>
          </Animated.View>
        )}

        {order.notes && (
          <Animated.View entering={FadeInUp.delay(680).springify().damping(31).mass(1).stiffness(100)}>
            <Card variant="outlined" padding="lg" style={styles.notesCard}>
              <Typography variant="bodySmall" weight="semibold">Delivery Notes</Typography>
              <Typography variant="bodySmall" color={colors.textSecondary}>{order.notes}</Typography>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['8xl'],
  },
  orderHeaderCard: {
    marginBottom: spacing.md,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  trackerCard: {
    marginBottom: spacing.xl,
  },
  trackerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trackerLine: {
    alignItems: 'center',
    width: 28,
  },
  trackerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerDotActive: {
    backgroundColor: colors.primary,
  },
  trackerDotCurrent: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primaryBg,
  },
  trackerLineTrack: {
    width: 2,
    flex: 1,
    minHeight: 36,
    backgroundColor: colors.border,
    marginVertical: 4,
    overflow: 'hidden',
    borderRadius: 1,
  },
  trackerLineFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  trackerContent: {
    marginLeft: spacing.md,
    paddingBottom: spacing.xl,
    flex: 1,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  summaryCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  addressCard: {
    marginBottom: spacing.md,
  },
  notesCard: {
    marginBottom: spacing.md,
  },
});
