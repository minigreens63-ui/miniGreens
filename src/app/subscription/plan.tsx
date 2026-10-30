import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { useProducts, useCategories } from '../../services/catalog';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { validateDeliveryDateInput } from '../../utils/date';
import type { Database } from '../../types/database';

type Address = Database['public']['Tables']['addresses']['Row'];
type PlanRow = Database['public']['Tables']['subscription_plans']['Row'];

// Maps a plan line such as "2 juices of your choice" to a shop category and a count, so the
// customer can pick the actual products that fill those slots. Same rules as the webapp
// (webapp/lib/subscriptions.ts). Lines without a leading count or category (perks, "seasonal
// special", ...) are shown as-is.
const ITEM_CATEGORY_KEYWORDS: { keyword: string; slug: string }[] = [
  { keyword: 'juice', slug: 'juices' },
  { keyword: 'microgreen', slug: 'microgreens' },
  { keyword: 'tea', slug: 'tea-blends' },
];

interface ParsedPlanItem {
  raw: string;
  qty: number | null;
  categorySlug: string | null;
}

function parsePlanItem(raw: string): ParsedPlanItem {
  const match = raw.match(/^(\d+)\s+(.*)$/);
  if (!match) return { raw, qty: null, categorySlug: null };
  const rest = match[2].toLowerCase();
  const found = ITEM_CATEGORY_KEYWORDS.find(({ keyword }) => rest.includes(keyword));
  return { raw, qty: Number(match[1]), categorySlug: found?.slug ?? null };
}

export default function PlanSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const { products, isLoading: productsLoading } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  // selections[itemIndex][slot] = productId
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsWhatsappConsent, setSmsWhatsappConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle()
      .then(({ data }) => {
        setPlan(data ?? null);
        setPlanLoading(false);
      });
  }, [planId]);

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

  const parsedItems = useMemo(() => (plan ? plan.items.map(parsePlanItem) : []), [plan]);

  // Available products for each pickable plan line.
  const optionsByItem = useMemo(() => {
    const map: Record<number, typeof products> = {};
    parsedItems.forEach((item, idx) => {
      if (!item.categorySlug || !item.qty) return;
      const cat = categories.find((c) => c.slug === item.categorySlug);
      map[idx] = cat ? products.filter((p) => p.categoryId === cat.id) : [];
    });
    return map;
  }, [parsedItems, categories, products]);

  // Default every slot to the first available product so the choice is never empty.
  useEffect(() => {
    setSelections((prev) => {
      const next = { ...prev };
      parsedItems.forEach((item, idx) => {
        const options = optionsByItem[idx];
        if (!item.qty || !options || options.length === 0) return;
        const existing = next[idx] ?? [];
        next[idx] = Array.from({ length: item.qty }, (_, i) => existing[i] ?? options[0].id);
      });
      return next;
    });
  }, [parsedItems, optionsByItem]);

  function pick(itemIdx: number, slot: number, productId: string) {
    Haptics.selectionAsync();
    setSelections((prev) => {
      const arr = [...(prev[itemIdx] ?? [])];
      arr[slot] = productId;
      return { ...prev, [itemIdx]: arr };
    });
  }

  function collectItems() {
    const counts = new Map<string, number>();
    parsedItems.forEach((item, idx) => {
      if (!item.categorySlug || !item.qty) return;
      (selections[idx] ?? []).forEach((productId) => {
        counts.set(productId, (counts.get(productId) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
  }

  async function handleSubmit() {
    if (!profile || !plan) return;
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
        plan_id: plan.id,
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

    const items = collectItems();
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('subscription_items')
        .insert(items.map((item) => ({ subscription_id: subscription.id, ...item })));

      if (itemsError) {
        await supabase.from('subscriptions').delete().eq('id', subscription.id);
        setSubmitting(false);
        setError(itemsError.message);
        return;
      }
    }

    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/subscription/manage');
  }

  if (planLoading || productsLoading || categoriesLoading) {
    return <Loading fullScreen />;
  }

  if (!session) {
    return (
      <Screen title="Subscribe" scroll={false}>
        <EmptyState
          icon="calendar-outline"
          title="Log in to subscribe"
          message="Choose your delivery address and start this plan once you're logged in."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, padding: spacing.lg }]}>
        <Typography variant="body">This plan could not be found.</Typography>
        <Button title="Back" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
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
        <Typography variant="body" weight="semibold">{plan.name}</Typography>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ErrorNotice message={error} title="Couldn't start subscription" onDismiss={() => setError(null)} />

        <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
          1. Choose what goes in your box
        </Typography>
        <Card variant="outlined" padding="lg">
          {parsedItems.map((item, idx) => {
            const options = optionsByItem[idx];
            if (!item.qty || !options) {
              return (
                <View key={idx} style={styles.plainItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Typography variant="bodySmall" color={colors.textSecondary}>{item.raw}</Typography>
                </View>
              );
            }
            return (
              <View key={idx} style={styles.slotBlock}>
                <View style={styles.plainItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Typography variant="bodySmall" weight="semibold">{item.raw}</Typography>
                </View>
                {options.length === 0 ? (
                  <Typography variant="caption" color={colors.textTertiary}>
                    No options available right now.
                  </Typography>
                ) : (
                  Array.from({ length: item.qty }).map((_, slot) => (
                    <View key={slot} style={{ marginBottom: spacing.sm }}>
                      <Typography variant="caption" color={colors.textTertiary}>
                        Choice {slot + 1}
                      </Typography>
                      <View style={styles.slotChips}>
                        {options.map((o) => (
                          <Chip
                            key={o.id}
                            label={o.name}
                            selected={(selections[idx]?.[slot] ?? options[0].id) === o.id}
                            onPress={() => pick(idx, slot, o.id)}
                            style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                          />
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </Card>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Typography variant="caption" color={colors.textSecondary} style={styles.infoBannerText}>
            Nothing is charged now. We'll confirm every delivery over the phone.
          </Typography>
        </View>

        <Typography variant="bodySmall" weight="semibold" color={colors.text} style={styles.sectionLabel}>
          2. Delivery Address
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
          placeholder="e.g., 2026-10-07"
          value={deliveryDate}
          onChangeText={setDeliveryDate}
          leftIcon="calendar-outline"
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
            Billed / {plan.unit ?? 'week'}
          </Typography>
          <Typography variant="h4" color={colors.primaryDark}>₹{plan.price.toFixed(0)}</Typography>
        </View>
        <Button
          title={submitting ? 'Starting...' : 'Start Subscription'}
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting || !termsAccepted}
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
  slotBlock: { marginBottom: spacing.md },
  slotChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  plainItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
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
