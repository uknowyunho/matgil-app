import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { StatCard } from './StatCard';

interface TotalCountWidgetProps {
  count: number;
  onPress?: () => void;
}

export function TotalCountWidget({ count, onPress }: TotalCountWidgetProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      <StatCard title="내 맛집">
        <View style={styles.row}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.unit}>곳</Text>
        </View>
      </StatCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  count: {
    ...Typography.display,
    fontSize: 40,
    color: Colors.light.primary.main,
  },
  unit: {
    ...Typography.title2,
    color: Colors.light.neutral.textBody,
  },
});
