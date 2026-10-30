import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Typography';

// A colour + initial-letter fallback rendered from real native primitives
// (View + Text), not an Image. The old approach generated an inline
// `data:image/svg+xml` string and handed it to <Image> — that renders fine on
// web (which is all this environment's preview can check), but React Native's
// native Image component cannot decode SVG at all, so every "placeholder" was
// silently blank on a real iOS/Android device. This component looks the same
// but actually renders everywhere.

const COLORS = [
  '#6f8f4a', '#6f8f4a', '#6f8f4a', '#FF8F00', '#00BFA5',
  '#6f8f4a', '#6f8f4a', '#6f8f4a', '#6f8f4a', '#6f8f4a',
  '#E91E63', '#9C27B0', '#3F51B5', '#FF5722', '#795548',
];

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface PlaceholderImageProps {
  label: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  round?: boolean;
}

export function PlaceholderImage({ label, color, style, round = false }: PlaceholderImageProps) {
  const bg = color || hashColor(label);
  const initial = label.trim()[0]?.toUpperCase() || '?';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg },
        round && styles.round,
        style,
      ]}
    >
      <Typography variant="h4" weight="bold" color="rgba(255,255,255,0.9)">
        {initial}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    borderRadius: 9999,
  },
});
