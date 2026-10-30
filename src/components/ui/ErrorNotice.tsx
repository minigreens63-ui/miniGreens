import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../../theme';
import { Typography } from './Typography';

interface ErrorNoticeProps {
  message: string | null;
  title?: string;
  onDismiss?: () => void;
  style?: object;
}

/** Inline, styled error banner — replacement for a bare Alert.alert. */
export function ErrorNotice({ message, title = 'Something went wrong', onDismiss, style }: ErrorNoticeProps) {
  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(30).mass(1).stiffness(100)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, style]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={20} color={colors.error} />
      </View>
      <View style={styles.body}>
        <Typography variant="bodySmall" weight="semibold" color={colors.error}>
          {title}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary} style={styles.message}>
          {message}
        </Typography>
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={10} style={styles.close} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  message: {
    marginTop: 2,
  },
  close: {
    padding: 2,
  },
});
