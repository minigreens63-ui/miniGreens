import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loading } from '../../components/ui/Loading';
import { Screen } from '../../components/layout/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { PartnerBusinessType, KycDocument } from '../../types/database';

const KYC_BUCKET = 'partner-kyc';

const BUSINESS_TYPES: { value: PartnerBusinessType; label: string }[] = [
  { value: 'individual', label: 'Individual Partner' },
  { value: 'women', label: 'Women Partner' },
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'shop', label: 'Shop' },
  { value: 'fitness_wellness', label: 'Fitness/Wellness Partner' },
  { value: 'community', label: 'Community Partner' },
];

const VALID_BUSINESS_TYPES = new Set(BUSINESS_TYPES.map((t) => t.value));

export default function PartnerApplyScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const params = useLocalSearchParams<{ type?: string }>();
  const presetType =
    params.type && VALID_BUSINESS_TYPES.has(params.type as PartnerBusinessType)
      ? (params.type as PartnerBusinessType)
      : null;

  const [businessType, setBusinessType] = useState<PartnerBusinessType | null>(presetType);
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  React.useEffect(() => {
    if (!session) {
      setCheckingExisting(false);
      return;
    }
    let cancelled = false;
    supabase
      .from('partners')
      .select('status')
      .eq('profile_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          router.replace(data.status === 'pending' ? '/partner/submitted' : '/partner/dashboard');
          return;
        }
        setCheckingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleAddDocument = async () => {
    if (!session) {
      setError('Log in first to upload documents.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    setError(null);
    setUploading(true);
    try {
      const fileRes = await fetch(asset.uri);
      const body = await fileRes.arrayBuffer();
      const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${session.user.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(KYC_BUCKET)
        .upload(path, body, { contentType: asset.mimeType ?? 'application/octet-stream', upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      setDocs((prev) => [...prev, { name: asset.name, path, uploaded_at: new Date().toISOString() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async (path: string) => {
    setDocs((prev) => prev.filter((d) => d.path !== path));
    await supabase.storage.from(KYC_BUCKET).remove([path]);
  };

  const handleSubmit = async () => {
    if (!session) {
      setError('Log in first to apply as a partner.');
      return;
    }
    if (!businessType || !businessName.trim() || !contactPerson.trim() || !phone.trim()) {
      setError('Fill in all required fields.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error: insertError } = await supabase.from('partners').insert({
      profile_id: session.user.id,
      business_type: businessType,
      business_name: businessName.trim(),
      contact_person: contactPerson.trim(),
      phone: phone.trim(),
      address: address.trim() || null,
      kyc_documents: docs,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.replace('/partner/submitted');
  };

  if (!session) {
    return (
      <Screen title="Become a Partner" scroll={false}>
        <EmptyState
          icon="briefcase-outline"
          title="Log in to apply"
          message="Sell MGC products, take orders, and grow your own business through the app."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  if (checkingExisting) {
    return <Loading fullScreen />;
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
            Become an MGC Partner
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Sell MGC products, take orders, and grow your own business through the app.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify().damping(31).mass(1).stiffness(100)}>
          <Typography variant="bodySmall" color={colors.textSecondary} weight="medium" style={styles.sectionLabel}>
            Business Type
          </Typography>
          <View style={styles.chipRow}>
            {BUSINESS_TYPES.map((type) => (
              <Chip
                key={type.value}
                label={type.label}
                selected={businessType === type.value}
                onPress={() => setBusinessType(type.value)}
              />
            ))}
          </View>
          {businessType === 'women' && (
            <View style={styles.womenNoteRow}>
              <Typography variant="caption" color={colors.primary} style={styles.womenNote}>
                Women Partners get 0% platform fee.
              </Typography>
              <Pressable onPress={() => router.push('/women-who-grow')} hitSlop={8}>
                <Typography variant="caption" color={colors.primary} weight="semibold" style={{ textDecorationLine: 'underline' }}>
                  Learn more about Sumam
                </Typography>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify().damping(31).mass(1).stiffness(100)} style={styles.form}>
          <TextField
            label="Business / Café / Shop Name"
            leftIcon="storefront-outline"
            placeholder="e.g. Green Leaf Café"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextField
            label="Contact Person"
            leftIcon="person-outline"
            placeholder="Your name"
            value={contactPerson}
            onChangeText={setContactPerson}
          />
          <TextField
            label="Phone"
            leftIcon="call-outline"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextField
            label="Address (optional)"
            leftIcon="location-outline"
            placeholder="Business address"
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.docsSection}>
            <Typography variant="bodySmall" color={colors.textSecondary} weight="medium" style={styles.sectionLabel}>
              KYC Documents (optional)
            </Typography>
            <Typography variant="caption" color={colors.textTertiary} style={styles.docsHint}>
              ID proof, business licence, GST certificate — image or PDF.
            </Typography>
            {docs.map((doc) => (
              <View key={doc.path} style={styles.docRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.primaryDark} />
                <Typography variant="bodySmall" color={colors.text} style={styles.docName} numberOfLines={1}>
                  {doc.name}
                </Typography>
                <Pressable onPress={() => handleRemoveDocument(doc.path)} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handleAddDocument}
              disabled={uploading}
              style={[styles.addDocButton, uploading && styles.addDocButtonDisabled]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primaryDark} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryDark} />
              )}
              <Typography variant="bodySmall" color={colors.primaryDark} weight="medium">
                {uploading ? 'Uploading…' : 'Add Document'}
              </Typography>
            </Pressable>
          </View>

          {error && (
            <Typography variant="bodySmall" color={colors.error} style={styles.error}>
              {error}
            </Typography>
          )}
          <Button title="Submit Application" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={styles.submit} />
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
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  womenNoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  womenNote: {
    flexShrink: 1,
  },
  form: {
    marginTop: spacing.lg,
  },
  error: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
  docsSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  docsHint: {
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  docName: {
    flex: 1,
  },
  addDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  addDocButtonDisabled: {
    opacity: 0.6,
  },
});
