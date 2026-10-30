import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, Switch } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/layout/Screen';
import { useCartStore, cartSubtotal } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';
import type { Database } from '../../types/database';

type Address = Database['public']['Tables']['addresses']['Row'];

type CheckoutStep = 'review' | 'delivery' | 'address';

const STEPS: CheckoutStep[] = ['review', 'delivery', 'address'];
const STEP_INDEX: Record<CheckoutStep, number> = { review: 0, delivery: 1, address: 2 };
const CONNECTOR_WIDTH = 60;
// BUG-13: flat delivery fee — a round INR figure (was 35.49).
const DELIVERY_FEE = 40;

const DELIVERY_WINDOW_DAYS = 7;

/** ISO date `DELIVERY_WINDOW_DAYS` from now — what Postgres `date` expects. */
function estimatedDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + DELIVERY_WINDOW_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Step Dot ────────────────────────────────────────────────────────────────

function StepDot({ index, activeIndex }: { index: number; activeIndex: number }) {
  const isActive = activeIndex >= index;
  const isCompleted = activeIndex > index;

  return (
    <Animated.View style={[styles.stepDot, isActive && styles.stepDotActive]}>
      {isCompleted ? (
        <Ionicons name="checkmark" size={14} color={colors.textInverse} />
      ) : (
        <Typography variant="caption" color={isActive ? colors.textInverse : colors.textTertiary} weight="bold">
          {index + 1}
        </Typography>
      )}
    </Animated.View>
  );
}

function StepConnector({ filled }: { filled: boolean }) {
  const fillWidth = useSharedValue(filled ? CONNECTOR_WIDTH : 0);

  useEffect(() => {
    fillWidth.value = withTiming(filled ? CONNECTOR_WIDTH : 0, { duration: 480, easing: Easing.out(Easing.cubic) });
  }, [filled]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <View style={styles.stepConnector}>
      <Animated.View style={[styles.stepConnectorFill, fillStyle]} />
    </View>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  isSelected,
  onSelect,
  index,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(80 + index * 100).springify().damping(31).mass(1).stiffness(100)} style={styles.addressCardOuter}>
      <Pressable onPress={onSelect}>
        <View style={[styles.addressCard, isSelected && styles.addressCardSelected]}>
          <View style={styles.addressHeader}>
            <View style={styles.addressLabelRow}>
              <View style={isSelected ? styles.radioActive : styles.radioInactive}>
                {isSelected && <Animated.View entering={ZoomIn.springify().damping(19).mass(1).stiffness(100)} style={styles.radioDot} />}
              </View>
              <Typography variant="bodySmall" weight="semibold" style={{ marginLeft: spacing.sm }}>
                {address.label}
              </Typography>
            </View>
            {address.is_default && (
              <View style={styles.defaultBadge}>
                <Typography variant="caption" color={colors.primary} weight="bold">DEFAULT</Typography>
              </View>
            )}
          </View>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.addressDetails}>
            {address.full_name} · {address.phone}
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary}>{address.street}</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            {address.city}, {address.state} {address.zip_code}
          </Typography>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const orderPlacedRef = useRef(false);

  const [step, setStep] = useState<CheckoutStep>('review');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const deliveryDate = useMemo(() => estimatedDeliveryDate(), []);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [isGift, setIsGift] = useState(false);
  const [giftOccasion, setGiftOccasion] = useState('');
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftRecipientPhone, setGiftRecipientPhone] = useState('');
  const [giftRecipientAddress, setGiftRecipientAddress] = useState('');
  const [giftSenderName, setGiftSenderName] = useState('');
  const [giftSenderPhone, setGiftSenderPhone] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const subtotal = cartSubtotal(items);
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.amount, subtotal) : 0;
  const total = Math.max(subtotal - discountAmount + DELIVERY_FEE, 0);
  const activeIndex = STEP_INDEX[step];

  const summaryRows: { label: string; value: string; bold?: boolean; accent?: boolean }[] = [
    { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
    ...(discountAmount > 0 && appliedCoupon
      ? [{ label: `Discount · ${appliedCoupon.code}`, value: `−₹${discountAmount.toFixed(2)}`, accent: true }]
      : []),
    { label: 'Delivery Fee', value: `₹${DELIVERY_FEE.toFixed(2)}` },
    { label: 'Total', value: `₹${total.toFixed(2)}`, bold: true },
  ];

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', profile.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => {
          setAddresses(data ?? []);
          if (data && data.length > 0 && !selectedAddressId) {
            setSelectedAddressId(data[0].id);
          }
        });
    }, [profile])
  );

  function goTo(next: CheckoutStep) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(next);
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    setCouponChecking(true);
    const { data, error } = await supabase.rpc('validate_discount', {
      p_code: code,
      p_subtotal: subtotal,
    });
    setCouponChecking(false);
    if (error) {
      setAppliedCoupon(null);
      setCouponError(error.message);
      return;
    }
    if (!data || !data.valid) {
      setAppliedCoupon(null);
      setCouponError(data?.reason ?? 'That coupon can’t be applied.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAppliedCoupon({ code: data.code ?? code.toUpperCase(), amount: data.discount_amount ?? 0 });
    setCouponError(null);
  }

  function handleRemoveCoupon() {
    Haptics.selectionAsync();
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  // BUG-09: keep an applied coupon's discount in sync with the live subtotal.
  // Cart quantities can change after a coupon is applied; without this a
  // percentage coupon keeps its stale absolute amount (only clamped by Math.min),
  // and a min-order coupon stays applied even after it no longer qualifies.
  useEffect(() => {
    if (!appliedCoupon) return;
    const code = appliedCoupon.code;
    let cancelled = false;
    supabase
      .rpc('validate_discount', { p_code: code, p_subtotal: subtotal })
      .then(({ data, error }) => {
        if (cancelled || error) return; // keep last known good amount on a transient error
        if (!data || !data.valid) {
          setAppliedCoupon(null);
          setCouponError(data?.reason ?? 'Coupon no longer applies to this order.');
          return;
        }
        const nextAmount = data.discount_amount ?? 0;
        setAppliedCoupon((prev) =>
          prev && prev.code === code && prev.amount !== nextAmount
            ? { code: prev.code, amount: nextAmount }
            : prev
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function handlePlaceOrder() {
    if (items.length === 0) return;
    if (!profile) {
      setOrderError('Your account is still loading. Please try again in a moment.');
      return;
    }
    setOrderError(null);
    if (!selectedAddressId) {
      setOrderError('Please select a delivery address.');
      return;
    }
    if (isGift && (!giftRecipientName.trim() || !giftRecipientPhone.trim() || !giftRecipientAddress.trim())) {
      setOrderError("Please add the recipient's name, phone and address for this gift.");
      return;
    }
    setPlacing(true);

    const orderNumber = `ORD${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        profile_id: profile.id,
        status: 'pending',
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        delivery_address_id: selectedAddressId,
        delivery_date: deliveryDate,
        delivery_time: null,
        notes: notes || null,
        order_type: 'preorder',
        business_name: null,
        contact_person: null,
        business_phone: null,
        business_address: null,
        discount_code: appliedCoupon?.code ?? null,
        discount_amount: discountAmount,
        is_gift: isGift,
        gift_occasion: isGift ? giftOccasion.trim() || null : null,
        gift_recipient_name: isGift ? giftRecipientName.trim() : null,
        gift_recipient_phone: isGift ? giftRecipientPhone.trim() : null,
        gift_recipient_address: isGift ? giftRecipientAddress.trim() : null,
        gift_sender_name: isGift ? giftSenderName.trim() || profile.full_name : null,
        gift_sender_phone: isGift ? giftSenderPhone.trim() || profile.phone : null,
      })
      .select()
      .single();

    if (error || !order) {
      setPlacing(false);
      setOrderError(error?.message ?? 'Please try again.');
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }))
    );

    if (itemsError) {
      // BUG-10: the order row exists but has no items — roll it back so we don't
      // leave an orphaned, unpayable order behind.
      await supabase.from('orders').delete().eq('id', order.id);
      setPlacing(false);
      setOrderError(itemsError.message);
      return;
    }
    setPlacing(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    orderPlacedRef.current = true;
    clearCart();
    router.replace(`/checkout/success?orderId=${order.id}`);
  }

  const renderStep = () => {
    switch (step) {
      case 'review':
        return (
          <Animated.View key="review" entering={FadeInRight.springify().damping(34).stiffness(180).mass(1)}>
            <Typography variant="h4" color={colors.text} style={styles.stepTitle}>
              Review Your Order
            </Typography>

            {items.map((item, i) => (
              <Animated.View key={item.productId} entering={FadeInUp.delay(80 + i * 60).springify().damping(31).mass(1).stiffness(100)}>
                <Card style={styles.productCard} variant="outlined" padding="lg">
                  <View style={styles.productRow}>
                    {item.image ? (
                      <Image
                        source={resolveImageSource(item.image)}
                        style={styles.productImage}
                      />
                    ) : (
                      <PlaceholderImage label={item.name} style={styles.productImage} />
                    )}
                    <View style={styles.productInfo}>
                      <Typography variant="body" weight="semibold">{item.name}</Typography>
                      <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </Typography>
                      <View style={styles.priceTag}>
                        <Typography variant="body" weight="bold" color={colors.primary}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </View>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}

            <View style={styles.couponBox}>
              <Typography variant="body" weight="semibold" style={styles.summaryTitle}>Coupon code</Typography>
              {appliedCoupon ? (
                <View style={styles.couponApplied}>
                  <View style={styles.couponAppliedLeft}>
                    <Ionicons name="pricetag" size={16} color={colors.primary} />
                    <Typography variant="bodySmall" weight="semibold" color={colors.primary} style={{ marginLeft: spacing.sm }}>
                      {appliedCoupon.code} applied
                    </Typography>
                  </View>
                  <Pressable onPress={handleRemoveCoupon} hitSlop={8}>
                    <Typography variant="bodySmall" weight="semibold" color={colors.error}>Remove</Typography>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <View style={styles.couponField}>
                    <TextField
                      placeholder="Enter code"
                      value={couponInput}
                      onChangeText={(t) => setCouponInput(t.toUpperCase())}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      leftIcon="pricetag-outline"
                    />
                  </View>
                  <Button
                    title="Apply"
                    variant="outline"
                    onPress={handleApplyCoupon}
                    disabled={couponChecking || !couponInput.trim()}
                    loading={couponChecking}
                    style={styles.couponApplyBtn}
                  />
                </View>
              )}
              {couponError && (
                <Typography variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
                  {couponError}
                </Typography>
              )}
            </View>

            <View style={styles.orderSummary}>
              <Typography variant="body" weight="semibold" style={styles.summaryTitle}>Order Summary</Typography>
              {summaryRows.map((item, i) => (
                <View key={i} style={[styles.summaryRow, item.bold && styles.summaryRowTotal]}>
                  <Typography variant="bodySmall" color={item.bold ? colors.text : colors.textSecondary} weight={item.bold ? 'semibold' : 'regular'}>
                    {item.label}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    color={item.bold || item.accent ? colors.primary : colors.textSecondary}
                    weight={item.bold ? 'bold' : item.accent ? 'semibold' : 'regular'}
                  >
                    {item.value}
                  </Typography>
                </View>
              ))}
            </View>

            <Button title="Continue to Delivery" variant="primary" size="lg" fullWidth onPress={() => goTo('delivery')} />
          </Animated.View>
        );

      case 'delivery':
        return (
          <Animated.View key="delivery" entering={FadeInRight.springify().damping(34).stiffness(180).mass(1)}>
            <Typography variant="h4" color={colors.text} style={styles.stepTitle}>Delivery Information</Typography>

            <View style={styles.deliveryNotice}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Typography variant="bodySmall" color={colors.text} style={{ marginLeft: spacing.sm, flex: 1 }}>
                All pre-orders are delivered within {DELIVERY_WINDOW_DAYS} days.
              </Typography>
            </View>

            <TextField label="Notes (Optional)" placeholder="Special instructions..." value={notes} onChangeText={setNotes} leftIcon="chatbubble-outline" multiline />

            <View style={styles.giftToggleRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="semibold" color={colors.text}>Send this as a gift</Typography>
                <Typography variant="bodySmall" color={colors.textSecondary}>
                  We'll deliver to someone else and let you add an occasion.
                </Typography>
              </View>
              <Switch
                value={isGift}
                onValueChange={(value) => {
                  Haptics.selectionAsync();
                  setIsGift(value);
                  if (value && !giftSenderName) setGiftSenderName(profile?.full_name ?? '');
                  if (value && !giftSenderPhone) setGiftSenderPhone(profile?.phone ?? '');
                }}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              />
            </View>

            {isGift && (
              <Animated.View entering={FadeIn}>
                <TextField
                  label="Occasion (optional)"
                  placeholder="e.g. Birthday"
                  value={giftOccasion}
                  onChangeText={setGiftOccasion}
                  leftIcon="gift-outline"
                />
                <TextField
                  label="Recipient's name"
                  placeholder="Who is this gift for?"
                  value={giftRecipientName}
                  onChangeText={setGiftRecipientName}
                  leftIcon="person-outline"
                />
                <TextField
                  label="Recipient's phone"
                  placeholder="Their contact number"
                  value={giftRecipientPhone}
                  onChangeText={setGiftRecipientPhone}
                  leftIcon="call-outline"
                  keyboardType="phone-pad"
                />
                <TextField
                  label="Recipient's delivery address"
                  placeholder="Where should we deliver the gift?"
                  value={giftRecipientAddress}
                  onChangeText={setGiftRecipientAddress}
                  leftIcon="location-outline"
                  multiline
                />
                <TextField
                  label="Your name (sender)"
                  placeholder="So we know who it's from"
                  value={giftSenderName}
                  onChangeText={setGiftSenderName}
                  leftIcon="person-circle-outline"
                />
                <TextField
                  label="Your phone (sender)"
                  placeholder="In case we need to reach you"
                  value={giftSenderPhone}
                  onChangeText={setGiftSenderPhone}
                  leftIcon="call-outline"
                  keyboardType="phone-pad"
                />
              </Animated.View>
            )}

            <Button
              title="Select Address"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => goTo('address')}
            />
            <Button title="Back" variant="ghost" fullWidth onPress={() => goTo('review')} style={styles.backButton} />
          </Animated.View>
        );

      case 'address':
        return (
          <Animated.View key="address" entering={FadeInRight.springify().damping(34).stiffness(180).mass(1)}>
            <Typography variant="h4" color={colors.text} style={styles.stepTitle}>Delivery Address</Typography>

            {addresses.length === 0 && (
              <Card variant="outlined" padding="lg" style={{ marginBottom: spacing.lg }}>
                <Typography variant="bodySmall" color={colors.textSecondary}>
                  No saved addresses yet.
                </Typography>
              </Card>
            )}

            {addresses.map((address, i) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddressId === address.id}
                onSelect={() => {
                  Haptics.selectionAsync();
                  setSelectedAddressId(address.id);
                }}
                index={i}
              />
            ))}

            <Button
              title="Add New Address"
              variant="outline"
              fullWidth
              onPress={() => router.push('/profile/addresses')}
              style={styles.backButton}
            />

            <Button
              title={placing ? 'Placing Pre-order...' : 'Place Pre-order'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={placing || !selectedAddressId}
              loading={placing}
              onPress={handlePlaceOrder}
              style={{ marginTop: spacing.md }}
            />
            <Button title="Back" variant="ghost" fullWidth onPress={() => goTo('delivery')} style={styles.backButton} />
          </Animated.View>
        );
    }
  };

  if (!session) {
    return (
      <Screen title="Checkout" scroll={false}>
        <EmptyState
          icon="bag-handle-outline"
          title="Log in to check out"
          message="Your cart is saved. Log in to choose a delivery address and place your order."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  if (items.length === 0 && !orderPlacedRef.current) {
    return (
      <Screen title="Checkout" scroll={false}>
        <EmptyState
          icon="bag-handle-outline"
          title="Your cart is empty"
          message="Add some greens to your cart to check out."
          actionLabel="Start Shopping"
          onAction={() => router.replace('/(tabs)/explore')}
        />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.headerButton}
          activeOpacity={0.7}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="body" weight="semibold">Checkout</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(80).duration(300)} style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <StepDot index={i} activeIndex={activeIndex} />
            {i < STEPS.length - 1 && <StepConnector filled={activeIndex > i} />}
          </View>
        ))}
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ErrorNotice message={orderError} title="Order failed" onDismiss={() => setOrderError(null)} />
        {renderStep()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepConnector: {
    width: CONNECTOR_WIDTH,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    borderRadius: 1,
    overflow: 'hidden',
  },
  stepConnectorFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['8xl'] },
  stepTitle: { marginBottom: spacing.xl, marginTop: spacing.sm },
  fieldLabel: { marginBottom: spacing.sm, marginTop: spacing.md },
  deliveryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  giftToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  productCard: { marginBottom: spacing.md },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceVariant,
  },
  productInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  priceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  orderSummary: {
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryTitle: { marginBottom: spacing.md },
  couponBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  couponRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  couponField: { flex: 1 },
  couponApplyBtn: { marginTop: 0 },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  couponAppliedLeft: { flexDirection: 'row', alignItems: 'center' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  summaryRowTotal: { borderTopWidth: 1.5, borderTopColor: colors.border },
  addressCardOuter: { marginBottom: spacing.md },
  addressCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  addressCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center' },
  radioInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.green[200],
  },
  addressDetails: { marginBottom: spacing.xs },
  backButton: { marginTop: spacing.sm },
});
