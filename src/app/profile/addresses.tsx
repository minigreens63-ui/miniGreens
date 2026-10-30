import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, Modal, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/layout/Screen';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Database } from '../../types/database';

type Address = Database['public']['Tables']['addresses']['Row'];

const EMPTY_FORM = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
};

function AddressCard({
  address,
  index,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const labelLower = address.label.toLowerCase();

  return (
    <Animated.View
      entering={FadeInUp.delay(120 + index * 80).springify().damping(31).mass(1).stiffness(100)}
      style={[animStyle, styles.cardWrapper]}
    >
      <Pressable
        style={[styles.card, address.is_default && styles.cardDefault]}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 31, stiffness: 220, mass: 1 }); }}
        onPress={onSetDefault}
      >
        <View style={styles.cardHeader}>
          <View style={styles.addressIcon}>
            <Ionicons
              name={labelLower === 'home' ? 'home-outline' : labelLower === 'work' ? 'briefcase-outline' : 'location-outline'}
              size={18}
              color={address.is_default ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={styles.cardMeta}>
            <Typography variant="bodySmall" weight="semibold" color={colors.text}>
              {address.label}
            </Typography>
            {address.is_default && (
              <Animated.View entering={ZoomIn.delay(180 + index * 80).springify().damping(19).mass(1).stiffness(100)} style={styles.defaultBadge}>
                <Typography variant="caption" color={colors.primary} weight="semibold">
                  Default
                </Typography>
              </Animated.View>
            )}
          </View>
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.editButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            {address.street}{address.apartment ? `, ${address.apartment}` : ''}
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            {address.city}, {address.state} {address.zip_code}
          </Typography>
          {address.phone && (
            <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.xs }}>
              {address.phone}
            </Typography>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', profile.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses(data ?? []);
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.full_name,
      phone: address.phone,
      street: address.street,
      apartment: address.apartment ?? '',
      city: address.city,
      state: address.state,
      zipCode: address.zip_code,
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!profile) return;
    if (!form.fullName || !form.phone || !form.street || !form.city || !form.state || !form.zipCode) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    const editingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined;
    const payload = {
      profile_id: profile.id,
      label: form.label,
      full_name: form.fullName,
      phone: form.phone,
      street: form.street,
      apartment: form.apartment || null,
      city: form.city,
      state: form.state,
      zip_code: form.zipCode,
      // On edit, keep the address's existing default status — it's never "the
      // list is empty" at this point since we're editing a row that's in it.
      is_default: editingId ? (editingAddress?.is_default ?? false) : addresses.length === 0,
    };

    const { error } = editingId
      ? await supabase.from('addresses').update(payload).eq('id', editingId)
      : await supabase.from('addresses').insert(payload);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not save address. Please try again.');
      return;
    }
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    load();
  }

  async function handleDelete(address: Address) {
    Alert.alert('Delete address', `Remove "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('addresses').delete().eq('id', address.id);
          if (error) {
            Alert.alert('Error', 'Could not delete address. Please try again.');
            return;
          }
          if (address.is_default && profile) {
            // Deleting the default address leaves no default — promote the most
            // recently added remaining one so checkout always has one to fall back on.
            const { data: remaining } = await supabase
              .from('addresses')
              .select('id')
              .eq('profile_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1);
            if (remaining && remaining.length > 0) {
              await supabase.from('addresses').update({ is_default: true }).eq('id', remaining[0].id);
            }
          }
          load();
        },
      },
    ]);
  }

  async function handleSetDefault(address: Address) {
    if (address.is_default || !profile) return;
    Haptics.selectionAsync();
    // Set the new default first so a failure on the clear-others step never
    // leaves the account with zero default addresses.
    const { error: setErr } = await supabase.from('addresses').update({ is_default: true }).eq('id', address.id);
    if (setErr) {
      Alert.alert('Error', 'Could not set default address. Please try again.');
      return;
    }
    await supabase.from('addresses').update({ is_default: false }).eq('profile_id', profile.id).neq('id', address.id);
    load();
  }

  if (!session) {
    return (
      <Screen title="Saved Addresses" scroll={false}>
        <EmptyState
          icon="location-outline"
          title="Log in to manage addresses"
          message="Your saved delivery addresses show up here."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
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
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="body" weight="semibold">Saved Addresses</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!loading && addresses.length === 0 && (
          <Typography variant="bodySmall" color={colors.textSecondary} align="center" style={{ marginTop: spacing.xl }}>
            No saved addresses yet.
          </Typography>
        )}
        {addresses.map((address, i) => (
          <AddressCard
            key={address.id}
            address={address}
            index={i}
            onEdit={() => openEdit(address)}
            onDelete={() => handleDelete(address)}
            onSetDefault={() => handleSetDefault(address)}
          />
        ))}

        <Animated.View entering={FadeInUp.delay(120 + addresses.length * 80).springify().damping(31).mass(1).stiffness(100)}>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openAdd();
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Typography variant="body" color={colors.primary} weight="semibold" style={{ marginLeft: spacing.sm }}>
              Add New Address
            </Typography>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Typography variant="h4" style={{ marginBottom: spacing.lg }}>
                {editingId ? 'Edit Address' : 'Add Address'}
              </Typography>
              <TextField label="Label (e.g. Home, Work)" value={form.label} onChangeText={(v) => setForm((f) => ({ ...f, label: v }))} />
              <TextField label="Full Name" value={form.fullName} onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))} />
              <TextField label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
              <TextField label="Street" value={form.street} onChangeText={(v) => setForm((f) => ({ ...f, street: v }))} />
              <TextField label="Apartment (optional)" value={form.apartment} onChangeText={(v) => setForm((f) => ({ ...f, apartment: v }))} />
              <TextField label="City" value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
              <TextField label="State" value={form.state} onChangeText={(v) => setForm((f) => ({ ...f, state: v }))} />
              <TextField label="ZIP Code" value={form.zipCode} onChangeText={(v) => setForm((f) => ({ ...f, zipCode: v }))} keyboardType="number-pad" />
              <Button title="Save Address" onPress={handleSave} loading={saving} fullWidth />
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} fullWidth style={{ marginTop: spacing.sm }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['8xl'],
  },
  cardWrapper: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  cardDefault: {
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryBg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.full,
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingLeft: 38 + spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryBg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    maxHeight: '88%',
  },
});
