import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface CategoryChipProps {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Converts a hex color to an rgba string with opacity.
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function CategoryChip({
  name,
  color,
  selected = false,
  onPress,
}: CategoryChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? {
              backgroundColor: hexToRgba(color, 0.2),
              borderColor: color,
              borderWidth: 1,
            }
          : {
              backgroundColor: Colors.light.neutral.card,
              borderColor: 'transparent',
              borderWidth: 1,
            },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? color : Colors.light.neutral.textBody },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
