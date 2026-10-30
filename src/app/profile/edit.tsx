import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows, typography, fontFamily } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/layout/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { formatDobDisplay, maskDobInput, parseDobInput } from '../../utils/date';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  delay: number;
  readOnly?: boolean;
  hint?: string;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', maxLength, delay, readOnly, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().damping(31).mass(1).stiffness(100)} style={styles.fieldWrapper}>
      <Typography variant="caption" weight="semibold" color={colors.textTertiary} uppercase style={styles.fieldLabel}>
        {label}
      </Typography>
      <View style={[styles.inputContainer, focused && styles.inputFocused, readOnly && styles.inputReadOnly]}>
        <TextInput
          style={[styles.input, readOnly && styles.inputTextReadOnly]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={!readOnly}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {hint && (
        <Typography variant="caption" color={colors.textTertiary} style={styles.fieldHint}>
          {hint}
        </Typography>
      )}
    </Animated.View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const email = profile?.email ?? '';
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [dob, setDob] = useState(formatDobDisplay(profile?.date_of_birth));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If `profile` is still loading when this screen mounts, the fields above
  // seed as empty — re-sync once it actually arrives. Keyed on `id` (not on
  // every profile change) so a post-save refetch doesn't clobber in-progress edits.
  const syncedProfileId = useRef(profile?.id);
  useEffect(() => {
    if (profile && profile.id !== syncedProfileId.current) {
      syncedProfileId.current = profile.id;
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setDob(formatDobDisplay(profile.date_of_birth));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    let dobIso: string | null = null;
    if (dob.trim()) {
      dobIso = parseDobInput(dob);
      if (!dobIso) {
        setError('Enter your date of birth as DD/MM/YYYY.');
        return;
      }
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        date_of_birth: dobIso,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await fetchProfile(profile.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (!session && !profile) {
    return (
      <Screen title="Edit Profile" scroll={false}>
        <EmptyState
          icon="person-outline"
          title="Log in to edit your profile"
          message="Your name, phone and birthday are saved to your account."
          actionLabel="Log In"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <Typography variant="body" weight="semibold">Edit Profile</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <Animated.View entering={FadeInUp.delay(60).springify().damping(31).mass(1).stiffness(100)} style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        <Field label="Full Name" value={fullName} onChangeText={setFullName} delay={120} />
        <Field
          label="Email"
          value={email}
          onChangeText={() => {}}
          keyboardType="email-address"
          delay={180}
          readOnly
          hint="Email is tied to your account and can't be changed here."
        />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" delay={240} />
        <Field
          label="Date of Birth"
          value={dob}
          onChangeText={(t) => setDob(maskDobInput(t))}
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          delay={270}
        />

        {error && (
          <Animated.View entering={FadeInUp.springify().damping(31).mass(1).stiffness(100)} style={styles.fieldWrapper}>
            <ErrorNotice message={error} onDismiss={() => setError(null)} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(380).springify().damping(31).mass(1).stiffness(100)} style={styles.saveButton}>
          <Button
            title="Save Changes"
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primaryBg,
    padding: 3,
    backgroundColor: colors.surface,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 44,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldWrapper: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  fieldHint: {
    marginTop: spacing.xs,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputReadOnly: {
    backgroundColor: colors.borderLight,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontFamily: fontFamily.sans,
  },
  inputTextReadOnly: {
    color: colors.textTertiary,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
