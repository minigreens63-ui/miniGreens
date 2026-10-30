import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

type OrderRow = Database['public']['Tables']['orders']['Row'];

export default function CheckoutSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  const iconScale = useSharedValue(0);
  const pulseScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (!orderId) {
      setLoadFailed(true);
      return;
    }
    let cancelled = false;
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLoadFailed(true);
        } else {
          setOrder(data);
          if (data.is_gift) setShowGiftModal(true);
        }
      });
    // Never leave the user on an endless spinner if the order row is slow / blocked (RLS, bad id).
    const timer = setTimeout(() => {
      if (!cancelled) setLoadFailed(true);
    }, 8000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  useEffect(() => {
    iconScale.value = withDelay(180, withSpring(1, { damping: 24, stiffness: 160, mass: 1 }));
    pulseScale.value = withDelay(400, withTiming(1.65, { duration: 850, easing: Easing.out(Easing.cubic) }));
    pulseOpacity.value = withDelay(400, withSequence(withTiming(0.35, { duration: 100 }), withTiming(0, { duration: 750 })));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }], opacity: pulseOpacity.value }));

  if (!order && !loadFailed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Loading fullScreen />
      </View>
    );
  }

  if (!order) {
    // Pre-order placed but we couldn't load the order row. Don't trap the user.
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.confirmHeader}>
          <View style={styles.confirmIconWrapper}>
            <LinearGradient
              colors={[colors.successLight, colors.green[100]]}
              style={styles.confirmIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark" size={44} color={colors.success} />
            </LinearGradient>
          </View>
          <View style={styles.confirmTextBlock}>
            <Typography variant="h3" color={colors.text} align="center" style={{ marginBottom: spacing.xs }}>
              Pre-order Placed!
            </Typography>
            <Typography variant="body" color={colors.textSecondary} align="center">
              We couldn't load the details here, but you can find it in My Orders. We'll
              notify you when it's confirmed for delivery.
            </Typography>
          </View>
        </View>
        <View style={styles.body}>
          <Button
            title="View My Orders"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(tabs)/orders');
            }}
          />
          <Button
            title="Continue Shopping"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/(tabs)/explore')}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.confirmHeader}>
        <View style={styles.confirmIconWrapper}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={iconStyle}>
            <LinearGradient
              colors={[colors.successLight, colors.green[100]]}
              style={styles.confirmIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark" size={44} color={colors.success} />
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(360).springify().damping(31).mass(1).stiffness(100)} style={styles.confirmTextBlock}>
          <Typography variant="h3" color={colors.text} align="center" style={{ marginBottom: spacing.xs }}>
            Pre-order Placed!
          </Typography>
          <Typography variant="body" color={colors.textSecondary} align="center">
            You won't be charged now. We'll notify you as your order is confirmed and progresses.
          </Typography>
        </Animated.View>
      </View>

      <View style={styles.body}>
        <Animated.View entering={FadeInUp.delay(500).springify().damping(31).mass(1).stiffness(100)}>
          <Card variant="outlined" padding="lg" style={styles.confirmCard}>
            <Typography variant="bodySmall" weight="semibold" style={{ marginBottom: spacing.md }}>
              Order Details
            </Typography>
            {[
              { label: 'Order Number', value: order.order_number },
              { label: 'Total', value: `₹${order.total.toFixed(2)}` },
            ].map((item, i) => (
              <View key={i} style={[styles.confirmRow, i === 0 && styles.confirmRowBorder]}>
                <Typography variant="bodySmall" color={colors.textSecondary}>{item.label}</Typography>
                <Typography variant="bodySmall" weight="semibold">{item.value}</Typography>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).springify().damping(31).mass(1).stiffness(100)}>
          <Button
            title="View My Orders"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(tabs)/orders');
            }}
          />
          <Button
            title="Continue Shopping"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/(tabs)/explore')}
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      </View>

      <Modal visible={showGiftModal} transparent animationType="fade" onRequestClose={() => setShowGiftModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBg}>
              <Ionicons name="gift" size={30} color={colors.primary} />
            </View>
            <Typography variant="h4" color={colors.text} align="center" style={{ marginTop: spacing.md }}>
              Gift order placed!
            </Typography>
            <Typography variant="body" color={colors.textSecondary} align="center" style={{ marginTop: spacing.sm }}>
              The MiniGreens team will contact you shortly regarding payment and delivery for this gift.
            </Typography>
            <Button
              title="Got it"
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.lg }}
              onPress={() => setShowGiftModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  confirmHeader: { alignItems: 'center', paddingVertical: spacing['2xl'], gap: spacing.xl },
  confirmIconWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.successLight },
  confirmIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', ...shadows.xl },
  confirmTextBlock: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  body: { padding: spacing.lg },
  confirmCard: { marginBottom: spacing['2xl'] },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  confirmRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.xl,
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
  },
});
