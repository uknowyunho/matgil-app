import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LocalExpense } from '../../store/useDashboardStore';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { StatCard } from './StatCard';

interface TopVisitedWidgetProps {
  expenses: LocalExpense[];
  year: number;
  month: number;
}

const LINE_COLORS = [
  Colors.light.primary.main,
  Colors.light.semantic.info,
  Colors.light.category.cafe,
];

const CHART_HEIGHT = 140;
const Y_AXIS_W = 22;
const X_AXIS_H = 20;

export function TopVisitedWidget({
  expenses,
  year,
  month,
}: TopVisitedWidgetProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const { restaurants } = useRestaurantStore();

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  const { series, maxVal } = useMemo(() => {
    const monthExpenses = expenses.filter((e) =>
      e.date.startsWith(monthPrefix),
    );

    // 태그 빈도 집계: memo 태그 우선, 없으면 식당 이름으로 대체
    const restaurantMap = new Map(restaurants.map((r) => [r.id, r.name]));
    const tagCount = new Map<string, number>();
    for (const e of monthExpenses) {
      const tags = e.memo
        ? e.memo.split(', ').filter(Boolean)
        : e.restaurantId
          ? [restaurantMap.get(e.restaurantId)].filter(Boolean) as string[]
          : [];
      for (const tag of tags) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }

    const top = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (top.length === 0) return { series: [], maxVal: 0 };

    // 날짜별 expense 그룹핑
    const byDate = new Map<string, LocalExpense[]>();
    for (const e of monthExpenses) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e);
      byDate.set(e.date, arr);
    }

    // 각 태그의 누적 일별 데이터
    const result = top.map(([name, total]) => {
      const points: number[] = [];
      let cum = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${monthPrefix}${String(d).padStart(2, '0')}`;
        const dayExpenses = byDate.get(dateStr) ?? [];
        for (const e of dayExpenses) {
          const tags = e.memo
            ? e.memo.split(', ').filter(Boolean)
            : e.restaurantId
              ? [restaurantMap.get(e.restaurantId)].filter(Boolean) as string[]
              : [];
          for (const tag of tags) {
            if (tag === name) cum++;
          }
        }
        points.push(cum);
      }
      return { name, total, points };
    });

    const max = Math.max(...result.map((s) => s.total), 1);
    return { series: result, maxVal: max };
  }, [expenses, restaurants, monthPrefix, daysInMonth]);

  const plotW = containerWidth - Y_AXIS_W;
  const plotH = CHART_HEIGHT - X_AXIS_H;

  const getX = (dayIdx: number) => {
    if (daysInMonth <= 1) return Y_AXIS_W + plotW / 2;
    return Y_AXIS_W + (dayIdx / (daysInMonth - 1)) * plotW;
  };

  const getY = (val: number) => plotH - (val / maxVal) * plotH;

  const xTicks = useMemo(() => {
    const t = [1];
    const step = Math.ceil(daysInMonth / 5);
    for (let d = step + 1; d < daysInMonth; d += step) t.push(d);
    if (t[t.length - 1] !== daysInMonth) t.push(daysInMonth);
    return t;
  }, [daysInMonth]);

  const yTicks = useMemo(() => {
    if (maxVal <= 0) return [0];
    if (maxVal <= 4)
      return Array.from({ length: maxVal + 1 }, (_, i) => i);
    const step = Math.ceil(maxVal / 3);
    const t = [0];
    for (let v = step; v < maxVal; v += step) t.push(v);
    if (t[t.length - 1] !== maxVal) t.push(maxVal);
    return t;
  }, [maxVal]);

  if (series.length === 0) {
    return (
      <StatCard title="나의 Favorite 음식">
        <Text style={styles.emptyText}>식비를 입력하면 표시됩니다</Text>
      </StatCard>
    );
  }

  return (
    <StatCard title="나의 Favorite 음식">
      {/* 꺾은선 그래프 */}
      <View
        style={styles.chartArea}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {containerWidth > 0 && (
          <>
            {/* Y축 그리드 */}
            {yTicks.map((v) => (
              <React.Fragment key={`y${v}`}>
                <View
                  style={[
                    styles.gridLine,
                    { top: getY(v), left: Y_AXIS_W, width: plotW },
                  ]}
                />
                <Text style={[styles.yLabel, { top: getY(v) - 7 }]}>{v}</Text>
              </React.Fragment>
            ))}

            {/* 꺾은선 */}
            {series.map((s, si) =>
              s.points.slice(0, -1).map((_, di) => {
                const x1 = getX(di);
                const y1 = getY(s.points[di]);
                const x2 = getX(di + 1);
                const y2 = getY(s.points[di + 1]);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={`l${si}-${di}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: x1,
                        top: y1 - 1,
                        width: len,
                        backgroundColor: LINE_COLORS[si],
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              }),
            )}

            {/* 변화 지점 도트 */}
            {series.map((s, si) =>
              s.points.map((val, di) => {
                if (di > 0 && val === s.points[di - 1]) return null;
                return (
                  <View
                    key={`d${si}-${di}`}
                    style={[
                      styles.dot,
                      {
                        left: getX(di) - 3,
                        top: getY(val) - 3,
                        backgroundColor: LINE_COLORS[si],
                      },
                    ]}
                  />
                );
              }),
            )}

            {/* X축 라벨 */}
            {xTicks.map((d) => (
              <Text
                key={`x${d}`}
                style={[
                  styles.xLabel,
                  { left: getX(d - 1) - 6, top: plotH + 4 },
                ]}
              >
                {d}
              </Text>
            ))}
          </>
        )}
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        {series.map((s, i) => (
          <View key={s.name} style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: LINE_COLORS[i] }]}
            />
            <Text style={styles.legendName} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={styles.legendCount}>{s.total}회</Text>
          </View>
        ))}
      </View>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // ── 차트 ──
  chartArea: {
    height: CHART_HEIGHT,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: Colors.light.neutral.border,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
    color: Colors.light.neutral.textSecondary,
    textAlign: 'right',
    width: Y_AXIS_W - 4,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.light.neutral.textSecondary,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: '0% 50%',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── 범례 ──
  legend: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.light.neutral.textTitle,
    flex: 1,
  },
  legendCount: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
});
