import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export async function syncPushTokenForUser(userId: string): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    return;
  }
  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
}

/** Route the user to the right screen when they tap a push notification. */
// `type` is a separate column on the `notifications` row, not a field inside its `data`
// jsonb — the Expo push payload embeds both in the same object, so callers vary. Pass each
// explicitly rather than assuming `data.type` exists.
export function routeFromNotificationData(
  type: unknown,
  data: Record<string, unknown> | null | undefined,
): void {
  if (type === 'order_status' && data && typeof data.order_id === 'string') {
    router.push(`/order/${data.order_id}`);
    return;
  }
  router.push('/notifications');
}

/**
 * Subscribe to notification taps. Call once from the root layout; returns an
 * unsubscribe fn. Also handles a cold start where the app was opened from a tap.
 */
export function addNotificationResponseListener(): () => void {
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        const data = response.notification.request.content.data as Record<string, unknown> | null;
        routeFromNotificationData(data?.type, data);
      }
    })
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | null;
    routeFromNotificationData(data?.type, data);
  });
  return () => sub.remove();
}
