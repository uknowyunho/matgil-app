import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatCard } from './StatCard';
import { MEAL_TYPES } from '../../constants/mealTypes';
import type { LocalExpense } from '../../store/useDashboardStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface WeeklyMealStatsWidgetProps {
  expenses: LocalExpense[];
}

const CHART_SIZE = 120;
const STROKE_WIDTH = 20;

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const label = `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;

  return { start: fmt(monday), end: fmt(sunday), label };
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만`;
  }
  return `${amount.toLocaleString()}원`;
}

interface MealStat {
  type: string;
  label: string;
  color: string;
  amount: number;
  percent: number;
}

// --- Donut chart arc segment (handles ≤180°; splits >180° recursively) ---

function ArcSegment({
  startDeg,
  sweepDeg,
  color,
}: {
  startDeg: number;
  sweepDeg: number;
  color: string;
}) {
  if (sweepDeg <= 0) return null;

  if (sweepDeg > 180) {
    return (
      <>
        <ArcSegment startDeg={startDeg} sweepDeg={180} color={color} />
        <ArcSegment
          startDeg={startDeg + 180}
          sweepDeg={sweepDeg - 180}
          color={color}
        />
      </>
    );
  }

  const half = CHART_SIZE / 2;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ rotate: `${startDeg}deg` }] },
      ]}
    >
      {/* Right-half clip container */}
      <View
        style={{
          position: 'absolute',
          left: half,
          top: 0,
          width: half,
          height: CHART_SIZE,
          overflow: 'hidden',
        }}
      >
        {/* Full circle with left-half colored, rotated to reveal sweep amount */}
        <View
          style={{
            position: 'absolute',
            left: -half,
            top: 0,
            width: CHART_SIZE,
            height: CHART_SIZE,
            borderRadius: half,
            overflow: 'hidden',
            transform: [{ rotate: `${sweepDeg}deg` }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: half,
              height: CHART_SIZE,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// --- Donut chart ---

function DonutChart({
  segments,
  total,
}: {
  segments: MealStat[];
  total: number;
}) {
  const arcs = useMemo(() => {
    const result: { startDeg: number; sweepDeg: number; color: string }[] = [];
    let current = 0;
    for (const seg of segments) {
      const sweep = total > 0 ? (seg.amount / total) * 360 : 0;
      if (sweep > 0) {
        result.push({ startDeg: current, sweepDeg: sweep, color: seg.color });
        current += sweep;
      }
    }
    return result;
  }, [segments, total]);

  const innerSize = CHART_SIZE - STROKE_WIDTH * 2;

  return (
    <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: CHART_SIZE,
          height: CHART_SIZE,
          borderRadius: CHART_SIZE / 2,
          backgroundColor: Colors.light.neutral.border,
        }}
      />
      {/* Colored arc segments */}
      {arcs.map((arc, i) => (
        <ArcSegment key={i} {...arc} />
      ))}
      {/* Center donut hole */}
      <View
        style={{
          position: 'absolute',
          left: STROKE_WIDTH,
          top: STROKE_WIDTH,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: Colors.light.neutral.card,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={styles.centerLabel}>합계</Text>
        <Text style={styles.centerAmount}>{formatAmount(total)}</Text>
      </View>
    </View>
  );
}

// --- Main widget ---

export function WeeklyMealStatsWidget({
  expenses,
}: WeeklyMealStatsWidgetProps) {
  const { mealStats, weeklyTotal, topMealStat, weekLabel } = useMemo(() => {
    const range = getWeekRange();

    const weekExpenses = expenses.filter(
      (e) => e.date >= range.start && e.date <= range.end && e.mealType,
    );

    const mealTotals = new Map<string, number>();
    for (const e of weekExpenses) {
      if (e.mealType) {
        mealTotals.set(
          e.mealType,
          (mealTotals.get(e.mealType) ?? 0) + e.amount,
        );
      }
    }

    const total = Array.from(mealTotals.values()).reduce((s, a) => s + a, 0);

    const stats: MealStat[] = MEAL_TYPES.filter((mt) =>
      mealTotals.has(mt.type),
    )
      .map((mt) => ({
        type: mt.type,
        label: mt.label,
        color: mt.color,
        amount: mealTotals.get(mt.type)!,
        percent:
          total > 0
            ? Math.round((mealTotals.get(mt.type)! / total) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Adjust rounding so percentages sum to 100
    if (stats.length > 0) {
      const diff = 100 - stats.reduce((s, st) => s + st.percent, 0);
      if (diff !== 0) stats[0].percent += diff;
    }

    const top = stats.length > 0 ? stats[0] : null;

    return {
      mealStats: stats,
      weeklyTotal: total,
      topMealStat: top,
      weekLabel: range.label,
    };
  }, [expenses]);

  if (mealStats.length === 0) {
    return (
      <StatCard title="이번 주 식비 분석">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            이번 주 식비 데이터가 없어요.{'\n'}식사 유형을 선택해서
            기록해보세요!
          </Text>
        </View>
      </StatCard>
    );
  }

  return (
    <StatCard title="이번 주 식비 분석">
      <Text style={styles.weekLabel}>{weekLabel}</Text>

      <View style={styles.chartRow}>
        <DonutChart segments={mealStats} total={weeklyTotal} />
        <View style={styles.legendContainer}>
          {mealStats.map((stat) => (
            <View key={stat.type} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: stat.color }]}
              />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {stat.label}
              </Text>
              <Text style={styles.legendPercent}>{stat.percent}%</Text>
            </View>
          ))}
        </View>
      </View>

      {topMealStat && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightText}>
            이번 주에는{' '}
            <Text
              style={[styles.insightHighlight, { color: topMealStat.color }]}
            >
              {topMealStat.label}
            </Text>
            에 가장 많은 돈을 쓰셨어요! ({topMealStat.percent}%)
          </Text>
        </View>
      )}
    </StatCard>
  );
}

const styles = StyleSheet.create({
  weekLabel: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    marginTop: -spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  legendContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    flex: 1,
  },
  legendPercent: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.light.neutral.textTitle,
  },
  insightContainer: {
    backgroundColor: Colors.light.primary.bg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  insightText: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerLabel: {
    ...Typography.overline,
    color: Colors.light.neutral.textSecondary,
  },
  centerAmount: {
    ...Typography.body2,
    fontWeight: '700',
    color: Colors.light.neutral.textTitle,
  },
});
