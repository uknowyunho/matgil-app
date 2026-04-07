import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatCard } from './StatCard';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface BudgetProgressCardProps {
  budgetGoal: number | null;
  spent: number;
  onSetBudget: () => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString();
}

function getProgressColor(percent: number): string {
  if (percent > 100) return '#C93B3B';
  if (percent >= 80) return '#D4952B';
  return '#2D8A56';
}

function getMessage(remaining: number): string {
  if (remaining > 0) {
    return `이번 달 남은 예산은 ${formatAmount(remaining)}원이에요!`;
  }
  if (remaining < 0) {
    return `이번 달 예산을 ${formatAmount(Math.abs(remaining))}원 초과했어요!`;
  }
  return '이번 달 예산을 정확히 사용했어요!';
}

export function BudgetProgressCard({
  budgetGoal,
  spent,
  onSetBudget,
}: BudgetProgressCardProps) {
  if (budgetGoal == null) {
    return (
      <StatCard title="예산 관리">
        <Text style={styles.emptyText}>월별 목표 예산을 설정해보세요</Text>
        <TouchableOpacity style={styles.setButton} onPress={onSetBudget}>
          <Text style={styles.setButtonText}>설정하기</Text>
        </TouchableOpacity>
      </StatCard>
    );
  }

  const percent = budgetGoal > 0 ? Math.round((spent / budgetGoal) * 100) : 0;
  const barWidth = Math.min(percent, 100);
  const color = getProgressColor(percent);
  const remaining = budgetGoal - spent;

  return (
    <StatCard title="예산 관리">
      {/* Progress bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${barWidth}%`, backgroundColor: color },
          ]}
        />
      </View>

      {/* Percent label */}
      <Text style={[styles.percentText, { color }]}>{percent}% 사용</Text>

      {/* Motivational message */}
      <Text style={styles.message}>{getMessage(remaining)}</Text>

      {/* Footer: goal amount + edit */}
      <View style={styles.footer}>
        <Text style={styles.goalText}>
          목표: {formatAmount(budgetGoal)}원
        </Text>
        <TouchableOpacity
          onPress={onSetBudget}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText}>수정</Text>
        </TouchableOpacity>
      </View>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  setButton: {
    backgroundColor: Colors.light.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  setButtonText: {
    ...Typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barBg: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.light.neutral.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  percentText: {
    ...Typography.body2,
    fontWeight: '600',
  },
  message: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  editText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.primary.main,
  },
});
