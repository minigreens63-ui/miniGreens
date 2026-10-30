import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { TextField } from '../../components/ui/TextField';
import { Loading } from '../../components/ui/Loading';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/layout/Screen';
import { useProducts } from '../../services/catalog';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { validateDeliveryDateInput } from '../../utils/date';
import type { Database } from '../../types/database';

type Address = Database['public']['Tables']['addresses']['Row'];
type Frequency = 'weekly' | 'monthly';

export default function CustomSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const { products, isLoading: productsLoading } = useProducts();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsWhatsappConsent, setSmsWhatsappConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const selectedEntries = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0),
    [quantities]
  );

  const subtotal = useMemo(
    () =>
      selectedEntries.reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === id);
        return sum + (product ? product.price * qty : 0);
      }, 0),
    [selectedEntries, products]
  );

  function adjustQty(id: string, delta: number) {
    Haptics.selectionAsync();
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }

  async function handleSubmit() {
    if (!profile) return;
    if (selectedEntries.length === 0) {
      setError('Choose at least one product.');
      return;
    }
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }
    const dateError = validateDeliveryDateInput(deliveryDate);
    if (dateError) {
      setError(dateError);
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: profile.id,
        plan_id: null,
        is_custom: true,
        custom_frequency: frequency,
        status: 'active',
        address_id: selectedAddressId,
        next_delivery_date: deliveryDate.trim(),
        terms_accepted: termsAccepted,
        sms_whatsapp_consent: smsWhatsappConsent,
      })
      .select()
      .single();

    if (subError || !subscription) {
      setSubmitting(false);
      setError(subError?.message ?? 'Could not start your subscription.');
      return;
    }

    const { error: itemsError } = await supabase.from('subscription_items').insert(
      selectedEntries.map(([productId, quantity]) => ({
        subscription_id: subscription.id,
        product_id: productId,
        quantity,
      }))
    );

    if (itemsError) {
      await supabase.from('subscriptions').delete().eq('id', subscription.id);
      setSubmitting(false);
      setError(itemsError.message);
      return;
    }

    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/subscription/manage');
  }

  if (productsLoading) {
    return <Loading fullScreen />;
  }

  if (!session) {
    return (
      <Screen title="Build Your Own" scroll={false}>
        <EmptyState
          icon="calendar-outline"
          title="Log in to subscribe"
          message="Pick your products, quantities and delivery details once you're logged in."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
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
        <Typography variant="body" weight="semibold">Build Your Own</Typography>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ErrorNotice message={error} title="Couldn't start subscription" onDismiss={() => setError(null)} />

        <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
          1. Choose your products
        </Typography>
        <Card variant="outlined" padding="lg" style={styles.productsCard}>
          {products.map((product) => {
            const qty = quantities[product.id] ?? 0;
            return (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Typography variant="bodySmall" weight="semibold">{product.name}</Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    ₹{product.price.toFixed(0)} {product.unit ? `/ ${product.unit}` : ''}
                  </Typography>
                </View>
                <View style={styles.qtySelector}>
                  <Pressable
                    style={[styles.qtyButton, qty === 0 && styles.qtyButtonDisabled]}
                    disabled={qty === 0}
                    onPress={() => adjustQty(product.id, -1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.primaryDark} />
                  </Pressable>
                  <Typography variant="bodySmall" weight="bold" color={colors.primaryDark} style={styles.qtyValue}>
                    {qty}
                  </Typography>
                  <Pressable style={styles.qtyButton} onPress={() => adjustQty(product.id, 1)}>
                    <Ionicons name="add" size={16} color={colors.primaryDark} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>

        <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
          2. Choose your frequency
        </Typography>
        <View style={styles.chipRow}>
          <Chip label="Weekly" selected={frequency === 'weekly'} onPress={() => setFrequency('weekly')} />
          <Chip label="Monthly" selected={frequency === 'monthly'} onPress={() => setFrequency('monthly')} />
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Typography variant="caption" color={colors.textSecondary} style={styles.infoBannerText}>
            Nothing is charged now. We'll confirm every delivery over the phone.
          </Typography>
        </View>

        <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
          Delivery Address
        </Typography>
        {addresses.length === 0 && (
          <Card variant="outlined" padding="lg" style={{ marginBottom: spacing.md }}>
            <Typography variant="bodySmall" color={colors.textSecondary}>No saved addresses yet.</Typography>
          </Card>
        )}
        {addresses.map((address) => {
          const selected = selectedAddressId === address.id;
          return (
            <Pressable
              key={address.id}
              onPress={() => { Haptics.selectionAsync(); setSelectedAddressId(address.id); }}
              style={[styles.addressCard, selected && styles.addressCardSelected]}
            >
              <View style={styles.addressHeaderRow}>
                <View style={selected ? styles.radioActive : styles.radioInactive}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Typography variant="bodySmall" weight="semibold" style={{ marginLeft: spacing.sm }}>
                  {address.label}
                </Typography>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Typography variant="caption" color={colors.primary} weight="bold">DEFAULT</Typography>
                  </View>
                )}
              </View>
              <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
                {address.full_name} · {address.phone}
              </Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {address.street}, {address.city}, {address.state} {address.zip_code}
              </Typography>
            </Pressable>
          );
        })}
        <Button
          title="Add New Address"
          variant="outline"
          fullWidth
          onPress={() => router.push('/profile/addresses')}
          style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}
        />

        <TextField
          label="First Delivery Date"
          placeholder="e.g., 2026-09-28"
          value={deliveryDate}
          onChangeText={setDeliveryDate}
          leftIcon="calendar-outline"
        />
        <TextField
          label="Delivery Notes (optional)"
          placeholder="Anything we should know..."
          value={notes}
          onChangeText={setNotes}
          leftIcon="chatbubble-outline"
          multiline
        />

        <View style={styles.consentBlock}>
          <Pressable
            style={styles.consentRow}
            onPress={() => { Haptics.selectionAsync(); setTermsAccepted((v) => !v); }}
          >
            <Ionicons
              name={termsAccepted ? 'checkbox' : 'square-outline'}
              size={20}
              color={termsAccepted ? colors.primary : colors.textSecondary}
            />
            <Typography variant="caption" color={colors.textSecondary} style={styles.consentText}>
              I agree to MGC&apos;s Terms &amp; Conditions and Privacy Policy.
            </Typography>
          </Pressable>
          <Pressable
            style={styles.consentRow}
            onPress={() => { Haptics.selectionAsync(); setSmsWhatsappConsent((v) => !v); }}
          >
            <Ionicons
              name={smsWhatsappConsent ? 'checkbox' : 'square-outline'}
              size={20}
              color={smsWhatsappConsent ? colors.primary : colors.textSecondary}
            />
            <Typography variant="caption" color={colors.textSecondary} style={styles.consentText}>
              I agree to receive important updates about my subscription through SMS/WhatsApp.
            </Typography>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View>
          <Typography variant="caption" color={colors.textTertiary}>
            Billed {frequency === 'weekly' ? '/ week' : '/ month'}
          </Typography>
          <Typography variant="h4" color={colors.primaryDark}>₹{subtotal.toFixed(0)}</Typography>
        </View>
        <Button
          title={submitting ? 'Starting...' : 'Start Subscription'}
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting || selectedEntries.length === 0 || !termsAccepted}
          onPress={handleSubmit}
        />
      </View>
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
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['8xl'] },
  sectionLabel: { marginBottom: spacing.md, marginTop: spacing.lg },
  productsCard: { marginBottom: spacing.md },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productInfo: { flex: 1, paddingRight: spacing.md },
  qtySelector: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: { opacity: 0.4 },
  qtyValue: { marginHorizontal: spacing.md, minWidth: 16, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoBannerText: { flex: 1, lineHeight: 17 },
  addressCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  addressCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  addressHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  radioInactive: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  defaultBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.green[200],
  },
  consentBlock: { marginTop: spacing.lg, gap: spacing.sm },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  consentText: { flex: 1, lineHeight: 17 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.lg,
  },
});
