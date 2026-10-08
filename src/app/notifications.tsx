import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Typography } from '../components/ui/Typography';
import { Loading } from '../components/ui/Loading';
import { ErrorNotice } from '../components/ui/ErrorNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { Screen } from '../components/layout/Screen';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { routeFromNotificationData } from '../lib/notifications';
import type { Database } from '../types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];

const ICON_BY_TYPE: Record<string, keyof typeof Ionicons.glyphMap> = {
  order_status: 'cube-outline',
  birthday: 'gift-outline',
  partner: 'briefcase-outline',
  offer: 'pricetag-outline',
  system: 'notifications-outline',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profileId = useAuthStore((s) => s.profile?.id);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', profileId],
    enabled: !!profileId,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profileId as string)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ['notifications', profileId] });
    await queryClient.invalidateQueries({ queryKey: ['notifications-unread', profileId] });
  }

  async function markAllRead() {
    if (!profileId || unreadCount === 0) return;
    Haptics.selectionAsync();
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .is('read_at', null);
    await invalidate();
  }

  async function openNotification(n: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!n.read_at && profileId) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', n.id);
      invalidate();
    }
    routeFromNotificationData(n.type, n.data);
  }

  if (!session) {
    return (
      <Screen title="Notifications" scroll={false}>
        <EmptyState
          icon="notifications-outline"
          title="Log in to see notifications"
          message="Order updates, offers and birthday rewards show up here."
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
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="body" weight="semibold">Notifications</Typography>
        <TouchableOpacity
          onPress={markAllRead}
          disabled={unreadCount === 0}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Ionicons
            name="checkmark-done"
            size={22}
            color={unreadCount === 0 ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Loading fullScreen message="Loading notifications" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ErrorNotice
            message={isError ? 'Could not load notifications. Pull to retry.' : null}
            title="Notifications unavailable"
            onDismiss={() => refetch()}
          />

          {!isError && notifications.length === 0 && (
            <EmptyState
              icon="notifications-outline"
              title="You're all caught up"
              message="Order updates, offers and birthday rewards will show up here."
            />
          )}

          {notifications.map((n) => {
            const unread = !n.read_at;
            return (
              <Pressable
                key={n.id}
                onPress={() => openNotification(n)}
                style={[styles.row, unread && styles.rowUnread]}
              >
                <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
                  <Ionicons
                    name={ICON_BY_TYPE[n.type] ?? 'notifications-outline'}
                    size={18}
                    color={unread ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Typography
                      variant="bodySmall"
                      weight={unread ? 'bold' : 'semibold'}
                      color={colors.text}
                      style={styles.rowTitle}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Typography>
                    {unread && <View style={styles.unreadDot} />}
                  </View>
                  <Typography variant="caption" color={colors.textSecondary} style={styles.rowText}>
                    {n.body}
                  </Typography>
                  <Typography variant="caption" color={colors.textTertiary} style={styles.rowTime}>
                    {relativeTime(n.created_at)}
                  </Typography>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  rowUnread: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: colors.surface },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { flex: 1 },
  rowText: { marginTop: 2, lineHeight: 17 },
  rowTime: { marginTop: spacing.xs },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
