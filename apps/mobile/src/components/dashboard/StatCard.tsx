import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface StatCardProps {
  title: string;
  children: React.ReactNode;
}

export function StatCard({ title, children }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
