import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface Segment {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function SegmentedControl({ segments, activeKey, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isActive = segment.key === activeKey;
        return (
          <TouchableOpacity
            key={segment.key}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(segment.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentActive: {
    backgroundColor: Colors.light.primary.main,
  },
  label: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.light.neutral.textSecondary,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
