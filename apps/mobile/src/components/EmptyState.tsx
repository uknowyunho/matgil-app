import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon Area */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>&#x1F371;</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            variant="primary"
            size="medium"
            onPress={onAction}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing['3xl'],
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
});
