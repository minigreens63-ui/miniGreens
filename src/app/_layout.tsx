import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { colors } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { addNotificationResponseListener } from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    const unsubscribeNotifications = addNotificationResponseListener();
    return () => {
      unsubscribe();
      unsubscribeNotifications();
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!appIsReady) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="auth/login" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="category/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="articles" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="offers" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="article/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="cart" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="preorder/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout/success" options={{ animation: 'fade' }} />
          <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/addresses" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/faq" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/about" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/contact" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/terms" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/privacy" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/returns" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile/shipping-policy" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="women-who-grow" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="subscription/manage" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="subscription/custom" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="subscription/plan" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
