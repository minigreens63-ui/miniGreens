import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/layout/Screen';
import { BottomActionBar } from '../../components/layout/BottomActionBar';
import { AddressPicker } from '../../components/profile/AddressPicker';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { useProduct } from '../../services/catalog';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { resolveImageSource } from '../../utils/placeholders';
import { PlaceholderImage } from '../../components/ui/PlaceholderImage';
import type { Database } from '../../types/database';

type Address = Database['public']['Tables']['addresses']['Row'];

export default function PreorderScreen() {
  const params = useLocalSearchParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const initialQty = Math.max(1, parseInt(Array.isArray(params.qty) ? params.qty[0] : params.qty ?? '1', 10) || 1);

  const profile = useAuthStore((s) => s.profile);
  const { data: product, isLoading } = useProduct(slug);

  const [quantity, setQuantity] = useState(initialQty);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setSelectedAddressId((cur) => cur || (data && data.length > 0 ? data[0].id : ''));
        });
    }, [profile])
  );

  if (isLoading) {
    return (
      <Screen title="Pre-order">
        <Card variant="outlined" padding="lg">
          <View style={styles.productRow}>
            <Skeleton width={64} height={64} borderRadiusVal={borderRadius.lg} />
            <View style={[styles.productInfo, { marginLeft: spacing.md }]}>
              <Skeleton width="60%" height={15} />
              <Skeleton width="40%" height={12} style={{ marginTop: spacing.sm }} />
            </View>
          </View>
        </Card>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen title="Pre-order" scroll={false}>
        <EmptyState
          icon="leaf-outline"
          title="Product not found"
          message="It may have been removed or is no longer available."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (!product.isAvailable) {
    return (
      <Screen title="Pre-order" scroll={false}>
        <EmptyState
          icon="leaf-outline"
          title="Not taking pre-orders"
          message="This product is no longer available to pre-order."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const lineTotal = product.price * quantity;

  async function handlePlacePreorder() {
    if (!profile || !product) return;
    setError(null);
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }
    setPlacing(true);

    const orderNumber = `PRE${Date.now().toString().slice(-8)}`;
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        profile_id: profile.id,
        status: 'pending',
        subtotal: lineTotal,
        delivery_fee: 0,
        total: lineTotal,
        delivery_address_id: selectedAddressId,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        order_type: 'preorder',
        business_name: null,
        contact_person: null,
        business_phone: null,
        business_address: null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      setPlacing(false);
      setError(orderErr?.message ?? 'Could not place the pre-order. Please try again.');
      return;
    }

    const { error: itemErr } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity,
      price: product.price,
      image: typeof product.images[0] === 'string' ? (product.images[0] as string) : null,
    });

    if (itemErr) {
      // BUG-10: roll back the orphaned order row (exists with zero items).
      await supabase.from('orders').delete().eq('id', order.id);
      setPlacing(false);
      setError(itemErr.message);
      return;
    }
    setPlacing(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/order/${order.id}`);
  }

  return (
    <Screen
      title="Pre-order"
      keyboardAvoiding
      footer={
        <BottomActionBar>
          <View>
            <Typography variant="caption" color={colors.textTertiary}>Reserved total</Typography>
            <Typography variant="h4" color={colors.primaryDark}>₹{lineTotal.toFixed(2)}</Typography>
          </View>
          {profile ? (
            <Button
              title="Place Pre-order"
              variant="primary"
              size="lg"
              loading={placing}
              disabled={placing || !selectedAddressId}
              onPress={handlePlacePreorder}
            />
          ) : (
            <Button title="Log in to pre-order" variant="primary" size="lg" onPress={() => router.push('/auth/login')} />
          )}
        </BottomActionBar>
      }
    >
      <ErrorNotice message={error} title="Pre-order failed" onDismiss={() => setError(null)} />

      {/* Product + quantity */}
      <Card variant="outlined" padding="lg" style={styles.productCard}>
        <View style={styles.productRow}>
          {product.images[0] ? (
            <Image
              source={resolveImageSource(product.images[0])}
              style={styles.productImage}
            />
          ) : (
            <PlaceholderImage label={product.name} style={styles.productImage} />
          )}
          <View style={styles.productInfo}>
            <Typography variant="body" weight="semibold">{product.name}</Typography>
            <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 2 }}>
              ₹{product.price.toFixed(2)} {product.unit ? `· ${product.unit}` : ''}
            </Typography>
          </View>
        </View>
        <View style={styles.qtyRow}>
          <Typography variant="bodySmall" weight="semibold">Quantity</Typography>
          <View style={styles.qtySelector}>
            <PressableScale
              style={styles.qtyButton}
              scaleTo={0.92}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={18} color={colors.primaryDark} />
            </PressableScale>
            <Typography variant="body" weight="bold" color={colors.primaryDark} style={styles.qtyValue}>
              {quantity}
            </Typography>
            <PressableScale
              style={styles.qtyButton}
              scaleTo={0.92}
              onPress={() => setQuantity((q) => q + 1)}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={18} color={colors.primaryDark} />
            </PressableScale>
          </View>
        </View>
      </Card>

      {/* Address */}
      <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
        Delivery Address
      </Typography>
      <AddressPicker addresses={addresses} selectedId={selectedAddressId} onSelect={setSelectedAddressId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  productCard: { marginBottom: spacing.lg },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceVariant,
  },
  productInfo: { flex: 1 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  qtySelector: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { marginHorizontal: spacing.lg, minWidth: 20, textAlign: 'center' },
  sectionLabel: { marginBottom: spacing.md },
});
