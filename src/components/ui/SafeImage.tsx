import React, { useState } from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';
import { PlaceholderImage } from './PlaceholderImage';

interface SafeImageProps {
  uri?: string;
  placeholder?: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
  size?: 'cover' | 'contain' | 'stretch';
}

export function SafeImage({
  uri,
  placeholder,
  style,
  containerStyle,
  fallbackColor,
  size = 'cover',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !uri || failed;

  return (
    <View style={[styles.container, containerStyle, showPlaceholder && { backgroundColor: 'transparent' }]}>
      {showPlaceholder ? (
        <PlaceholderImage label={placeholder || 'MiniGreens'} color={fallbackColor || colors.primary} />
      ) : (
        <Image
          source={{ uri }}
          style={[style, { width: style?.width as number || '100%', height: style?.height as number || '100%' }]}
          contentFit={size === 'stretch' ? 'fill' : size}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
