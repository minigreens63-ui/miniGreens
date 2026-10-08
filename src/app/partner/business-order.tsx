import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Loading } from '../../components/ui/Loading';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

type PartnerRow = Database['public']['Tables']['partners']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type CartLine = { productId: string; quantity: number };

// Bulk/business ordering disabled for now — flip to true to re-enable.
const BUSINESS_ORDER_ENABLED = false;

export default function BusinessOrderScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      const [{ data: partnerData }, { data: productData }] = await Promise.all([
        supabase.from('partners').select('*').eq('profile_id', session.user.id).maybeSingle(),
        supabase.from('products').select('*').eq('is_available', true).order('name'),
      ]);
      if (partnerData) {
        setPartner(partnerData);
        setBusinessName(partnerData.business_name);
        setContactPerson(partnerData.contact_person);
        setPhone(partnerData.phone);
        setAddress(partnerData.address ?? '');
      }
      setProducts(productData ?? []);
      setLoading(false);
    })();
  }, [session]);

  function toggleProduct(productId: string) {
    setCart((prev) =>
      prev.some((line) => line.productId === productId)
        ? prev.filter((line) => line.productId !== productId)
        : [...prev, { productId, quantity: 1 }]
    );
  }

  function setLineQuantity(productId: string, quantity: number) {
    const clamped = Math.max(1, Math.floor(quantity) || 1);
    setCart((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity: clamped } : line)));
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const cartLines = cart
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .filter((entry): entry is { line: CartLine; product: ProductRow } => !!entry.product);
  const total = cartLines.reduce((sum, { line, product }) => sum + Number(product.price) * line.quantity, 0);

  const handleSubmit = async () => {
    if (!session || !partner) return;
    if (!businessName.trim() || !contactPerson.trim() || !phone.trim() || cartLines.length === 0 || !deliveryDate.trim()) {
      setError('Fill in all required fields and add at least one product.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const orderNumber = `BIZ-${Date.now()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        profile_id: session.user.id,
        status: 'pending',
        subtotal: total,
        delivery_fee: 0,
        total,
        delivery_address_id: null,
        delivery_date: deliveryDate.trim(),
        delivery_time: null,
        notes: notes.trim() || null,
        order_type: 'business',
        business_name: businessName.trim(),
        contact_person: contactPerson.trim(),
        business_phone: phone.trim(),
        business_address: address.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      setError(orderError?.message ?? 'Could not place order.');
      return;
    }

    const { error: itemError } = await supabase.from('order_items').insert(
      cartLines.map(({ line, product }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: line.quantity,
        price: Number(product.price),
        image: null,
      }))
    );

    if (itemError) {
      // BUG-10: roll back the orphaned order row (exists with zero items).
      await supabase.from('orders').delete().eq('id', order.id);
      setSubmitting(false);
      setError(itemError.message);
      return;
    }
    setSubmitting(false);
    // BUG-11: land on the new order's detail screen (same as the pre-order and
    // standard checkout flows) instead of silently dropping the partner back on
    // the dashboard with no confirmation of what was placed.
    router.replace(`/order/${order.id}`);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!BUSINESS_ORDER_ENABLED) {
    return (
      <View style={[styles.container, styles.disabledContainer, { paddingTop: insets.top + spacing['2xl'] }]}>
        <Typography variant="h3" color={colors.text} style={styles.title}>
          Business Ordering Unavailable
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Bulk ordering is temporarily unavailable. Please contact us directly for business orders.
        </Typography>
        <Button title="Back to Dashboard" onPress={() => router.replace('/partner/dashboard')} size="lg" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.delay(40).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="h2" color={colors.text} style={styles.title}>
            Place Business Order
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Bulk order for {partner?.business_name}. This goes straight to MGC Admin.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify().damping(31).mass(1).stiffness(100)}>
          <TextField label="Café/Shop Name" value={businessName} onChangeText={setBusinessName} leftIcon="storefront-outline" />
          <TextField label="Contact Person" value={contactPerson} onChangeText={setContactPerson} leftIcon="person-outline" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} leftIcon="call-outline" keyboardType="phone-pad" />
          <TextField label="Address" value={address} onChangeText={setAddress} leftIcon="location-outline" />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="bodySmall" color={colors.textSecondary} weight="medium" style={styles.sectionLabel}>
            Products
          </Typography>
          <Typography variant="caption" color={colors.textTertiary} style={styles.sectionHint}>
            Tap to add a product, then set its quantity below.
          </Typography>
          <View style={styles.chipRow}>
            {products.map((product) => (
              <Chip
                key={product.id}
                label={`${product.name} · ₹${Number(product.price).toFixed(0)}`}
                selected={cart.some((line) => line.productId === product.id)}
                onPress={() => toggleProduct(product.id)}
              />
            ))}
          </View>
        </Animated.View>

        {cartLines.length > 0 && (
          <Animated.View entering={FadeInUp.delay(190).springify().damping(31).mass(1).stiffness(100)} style={styles.cartList}>
            {cartLines.map(({ line, product }) => (
              <View key={product.id} style={styles.cartRow}>
                <View style={styles.cartRowInfo}>
                  <Typography variant="bodySmall" weight="semibold" color={colors.text} numberOfLines={1}>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color={colors.textTertiary}>
                    ₹{Number(product.price).toFixed(0)} each
                  </Typography>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setLineQuantity(product.id, line.quantity - 1)}
                    style={styles.stepperButton}
                    hitSlop={8}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </Pressable>
                  <TextInput
                    value={String(line.quantity)}
                    onChangeText={(v) => setLineQuantity(product.id, parseInt(v, 10))}
                    keyboardType="number-pad"
                    style={styles.stepperInput}
                  />
                  <Pressable
                    onPress={() => setLineQuantity(product.id, line.quantity + 1)}
                    style={styles.stepperButton}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={14} color={colors.text} />
                  </Pressable>
                </View>
                <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.cartRowTotal}>
                  ₹{(Number(product.price) * line.quantity).toFixed(0)}
                </Typography>
                <Pressable onPress={() => removeLine(product.id)} hitSlop={8} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(220).springify().damping(31).mass(1).stiffness(100)}>
          <TextField
            label="Required Delivery Date"
            placeholder="e.g., 2026-09-01"
            value={deliveryDate}
            onChangeText={setDeliveryDate}
            leftIcon="calendar-outline"
          />
          <TextField
            label="Additional Instructions (optional)"
            value={notes}
            onChangeText={setNotes}
            leftIcon="chatbubble-outline"
            multiline
          />
          {cartLines.length > 0 && (
            <Typography variant="body" weight="semibold" color={colors.primaryDark} style={styles.subtotal}>
              Total: ₹{total.toFixed(2)}
            </Typography>
          )}
          {error && (
            <Typography variant="bodySmall" color={colors.error} style={styles.error}>
              {error}
            </Typography>
          )}
          <Button title="Submit Order" onPress={handleSubmit} loading={submitting} fullWidth size="lg" style={styles.submit} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  disabledContainer: {
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: 2,
  },
  sectionHint: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  cartList: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cartRowInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartRowTotal: {
    width: 56,
    textAlign: 'right',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepperButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    padding: 0,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtotal: {
    marginBottom: spacing.lg,
  },
  error: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
