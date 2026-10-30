import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useCartStore, cartSubtotal } from '../store/useCartStore';
import { resolveImageSource } from '../utils/placeholders';
import { PlaceholderImage } from '../components/ui/PlaceholderImage';

// Must match `DELIVERY_FEE` in checkout/index.tsx — shown here so the cart
// total isn't a surprise once the user reaches checkout.
const DELIVERY_FEE = 40;

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = cartSubtotal(items);

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
        <Typography variant="body" weight="semibold">Your Cart</Typography>
        <View style={styles.headerButton} />
      </Animated.View>

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add some fresh greens to get started."
          actionLabel="Start Shopping"
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {items.map((item, i) => (
              <Animated.View key={item.productId} entering={FadeInUp.delay(i * 60).springify().damping(31).mass(1).stiffness(100)}>
                <Card style={styles.itemCard} padding="lg">
                  <View style={styles.itemRow}>
                    {item.image ? (
                      <Image
                        source={resolveImageSource(item.image)}
                        style={styles.itemImage}
                      />
                    ) : (
                      <PlaceholderImage label={item.name} style={styles.itemImage} />
                    )}
                    <View style={styles.itemInfo}>
                      <Typography variant="bodySmall" weight="semibold" numberOfLines={1}>
                        {item.name}
                      </Typography>
                      <Typography variant="bodySmall" color={colors.primaryDark} weight="bold" style={{ marginTop: 2 }}>
                        ₹{item.price.toFixed(2)}
                      </Typography>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                          accessibilityLabel={`Decrease quantity of ${item.name}`}
                        >
                          <Ionicons name="remove" size={16} color={colors.primaryDark} />
                        </TouchableOpacity>
                        <Typography variant="bodySmall" weight="bold" style={styles.qtyValue}>
                          {item.quantity}
                        </Typography>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                          accessibilityLabel={`Increase quantity of ${item.name}`}
                        >
                          <Ionicons name="add" size={16} color={colors.primaryDark} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeItem(item.productId)}
                      style={styles.removeButton}
                      accessibilityLabel={`Remove ${item.name} from cart`}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </ScrollView>

          <Animated.View entering={FadeInUp.springify().damping(31).mass(1).stiffness(100)} style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.subtotalRow}>
              <Typography variant="body" color={colors.textSecondary}>Subtotal</Typography>
              <Typography variant="body" color={colors.text}>₹{subtotal.toFixed(2)}</Typography>
            </View>
            <View style={styles.subtotalRow}>
              <Typography variant="body" color={colors.textSecondary}>Delivery Fee</Typography>
              <Typography variant="body" color={colors.text}>₹{DELIVERY_FEE.toFixed(2)}</Typography>
            </View>
            <View style={styles.subtotalRow}>
              <Typography variant="body" weight="semibold" color={colors.text}>Total</Typography>
              <Typography variant="h4" color={colors.primaryDark}>₹{(subtotal + DELIVERY_FEE).toFixed(2)}</Typography>
            </View>
            <Button
              title="Proceed to Checkout"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/checkout');
              }}
            />
          </Animated.View>
        </>
      )}
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
    paddingBottom: spacing['4xl'],
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    marginHorizontal: spacing.md,
    minWidth: 18,
    textAlign: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.md,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
