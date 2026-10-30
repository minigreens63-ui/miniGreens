import React from 'react';
import { StyleSheet, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';

interface AvatarProps {
  source: string;
  size?: number;
  style?: ImageStyle;
}

export function Avatar({ source, size = 48, style }: AvatarProps) {
  return (
    <Image
      source={{ uri: source }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 } as ImageStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  } as ImageStyle,
});
