import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { Review } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { Rating } from './Rating';

interface ReviewCardProps {
  review: Review;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Rating value={review.rating} size="sm" readonly />
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.editText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Text style={styles.deleteText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.content}>{review.content}</Text>

      <View style={styles.metaRow}>
        {review.visitedDate != null && (
          <Text style={styles.metaText}>
            방문 {formatDate(review.visitedDate)}
          </Text>
        )}
        {review.amount != null && (
          <Text style={styles.metaText}>{formatAmount(review.amount)}</Text>
        )}
      </View>

      <Text style={styles.createdAt}>{formatDate(review.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editText: {
    ...Typography.caption,
    color: Colors.light.primary.main,
  },
  deleteText: {
    ...Typography.caption,
    color: Colors.light.semantic.error,
  },
  content: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  createdAt: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
});
