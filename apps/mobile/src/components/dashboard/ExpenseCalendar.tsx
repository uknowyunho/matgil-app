import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { DailyExpense } from '../../types';
import { MEAL_TYPE_COLOR_MAP, MEAL_TYPES, type MealType } from '../../constants/mealTypes';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { StatCard } from './StatCard';

interface ExpenseCalendarProps {
  year: number;
  month: number;
  dailyExpenses: DailyExpense[];
  monthlyTotal: number;
  dailyAverage: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayPress: (date: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    // 소수점 첫째 자리가 0이면 정수만 표시
    return man % 1 === 0 ? `${man}만` : `${man.toFixed(1)}만`;
  }
  if (amount >= 1000) {
    // 1,000~9,999 → "8.5천" 형식
    const chun = amount / 1000;
    return chun % 1 === 0 ? `${chun}천` : `${chun.toFixed(1)}천`;
  }
  return `${amount}`;
}

function formatTotalAmount(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function ExpenseCalendar({
  year,
  month,
  dailyExpenses,
  monthlyTotal,
  dailyAverage,
  onPrevMonth,
  onNextMonth,
  onDayPress,
}: ExpenseCalendarProps) {
  // Build expense map for quick lookup
  const expenseMap = new Map<number, number>();
  const mealTypeMap = new Map<number, string[]>();
  const mealTypeOrder = MEAL_TYPES.map((mt) => mt.type);
  for (const expense of dailyExpenses) {
    const day = parseInt(expense.date.split('-')[2], 10);
    expenseMap.set(day, (expenseMap.get(day) ?? 0) + expense.amount);
    if (expense.mealTypes && expense.mealTypes.length > 0) {
      mealTypeMap.set(
        day,
        [...expense.mealTypes].sort(
          (a, b) => mealTypeOrder.indexOf(a as MealType) - mealTypeOrder.indexOf(b as MealType),
        ),
      );
    }
  }

  // Calendar grid calculation
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Fill leading empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const today = new Date();
  const isToday = (day: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    day === today.getDate();

  return (
    <StatCard title="식비 캘린더">
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {year}년 {month}월
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Text style={styles.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Header */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, i) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                i === 0 && styles.sundayText,
                i === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }

            const amount = expenseMap.get(day);
            const dayMealTypes = mealTypeMap.get(day);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[styles.dayCell, isToday(day) && styles.todayCell]}
                onPress={() => onDayPress(dateStr)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.dayText,
                    dayIndex === 0 && styles.sundayText,
                    dayIndex === 6 && styles.saturdayText,
                    isToday(day) && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
                {amount != null && amount > 0 ? (
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountText} numberOfLines={1}>
                      {formatAmount(amount)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.amountPlaceholder} />
                )}
                {dayMealTypes && dayMealTypes.length > 0 ? (
                  <View style={styles.dotsRow}>
                    {dayMealTypes.map((mt) => (
                      <View
                        key={mt}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              MEAL_TYPE_COLOR_MAP[mt] ??
                              Colors.light.neutral.textSecondary,
                          },
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Monthly Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>월 총액</Text>
          <Text style={styles.summaryValue}>
            {formatTotalAmount(monthlyTotal)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>일 평균</Text>
          <Text style={styles.summaryValue}>
            {formatTotalAmount(dailyAverage)}
          </Text>
        </View>
      </View>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: spacing.sm,
  },
  navText: {
    ...Typography.title2,
    color: Colors.light.primary.main,
  },
  monthLabel: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  sundayText: {
    color: Colors.light.semantic.error,
  },
  saturdayText: {
    color: Colors.light.semantic.info,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: 2,
    minHeight: 50,
    justifyContent: 'flex-start',
  },
  todayCell: {
    backgroundColor: Colors.light.primary.bg,
    borderRadius: borderRadius.sm,
  },
  dayText: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    lineHeight: 18,
  },
  todayText: {
    color: Colors.light.primary.main,
    fontWeight: '700',
  },
  amountBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(232, 102, 61, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  amountText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.light.primary.main,
    textAlign: 'center',
  },
  amountPlaceholder: {
    height: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.bg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.neutral.border,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  summaryValue: {
    ...Typography.body1,
    fontWeight: '700',
    color: Colors.light.neutral.textTitle,
  },
});
