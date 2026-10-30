import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from './Typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onPress?: () => void;
  /** Frosted style for placing over a dark photographic hero. */
  onDark?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search products...',
  autoFocus = false,
  onPress,
  onDark = false,
}: SearchBarProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, onDark && styles.containerDark]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons
          name="search"
          size={18}
          color={onDark ? 'rgba(255,255,255,0.9)' : colors.textTertiary}
          style={{ marginRight: 10 }}
        />
        <Typography
          variant="bodySmall"
          color={onDark ? 'rgba(255,255,255,0.65)' : colors.textTertiary}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {placeholder}
        </Typography>
        <View style={[styles.filterButton, onDark && styles.filterButtonDark]}>
          <Ionicons name="options-outline" size={16} color={onDark ? colors.onAccent : colors.accent} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textTertiary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceTranslucent,
    borderRadius: borderRadius.pill,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonDark: {
    backgroundColor: colors.accent,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  placeholderLine: {
    height: 12,
    width: 160,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  clearButton: {
    padding: spacing.xs,
  },
});
