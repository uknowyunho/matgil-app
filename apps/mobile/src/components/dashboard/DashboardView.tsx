import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  View,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { TotalCountWidget } from './TotalCountWidget';
import { ExpenseCalendar } from './ExpenseCalendar';
import { ExpenseInputModal } from './ExpenseInputModal';
import { BudgetProgressCard } from './BudgetProgressCard';
import { BudgetSettingModal } from './BudgetSettingModal';
import { TopVisitedWidget } from './TopVisitedWidget';
import { WeeklyMealStatsWidget } from './WeeklyMealStatsWidget';

export function DashboardView() {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const {
    stats,
    localExpenses,
    isLoading,
    year,
    month,
    setMonth,
    fetchDashboardStats,
    addFoodExpense,
    updateLocalExpense,
    deleteLocalExpense,
    getExpensesForDate,
    getMergedDailyExpenses,
    getMergedMonthlyTotal,
    getMergedDailyAverage,
    budgetGoal,
    setBudgetGoal,
  } = useDashboardStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats, year, month]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [fetchDashboardStats]),
  );

  const mergedExpenses = getMergedDailyExpenses();
  const mergedTotal = getMergedMonthlyTotal();
  const mergedAverage = getMergedDailyAverage();

  // 선택된 날짜의 기존 식비 목록
  const selectedDateExpenses = selectedDate
    ? getExpensesForDate(selectedDate)
    : [];

  const handlePrevMonth = useCallback(() => {
    if (month === 1) {
      setMonth(year - 1, 12);
    } else {
      setMonth(year, month - 1);
    }
  }, [year, month, setMonth]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) {
      setMonth(year + 1, 1);
    } else {
      setMonth(year, month + 1);
    }
  }, [year, month, setMonth]);

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date);
    setModalVisible(true);
  }, []);

  const handleSaveExpense = useCallback(
    (amount: number, memo: string, mealType?: string, restaurantId?: string, isCorporate?: boolean) => {
      addFoodExpense({
        date: selectedDate,
        amount,
        memo: memo || undefined,
        mealType,
        restaurantId,
        isCorporate,
      });
    },
    [selectedDate, addFoodExpense],
  );

  const handleUpdateExpense = useCallback(
    (id: string, amount: number, memo: string, mealType?: string, restaurantId?: string, isCorporate?: boolean) => {
      updateLocalExpense(id, { amount, memo: memo || undefined, mealType, restaurantId, isCorporate });
    },
    [updateLocalExpense],
  );

  const handleDeleteExpense = useCallback(
    (id: string) => {
      deleteLocalExpense(id);
    },
    [deleteLocalExpense],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  }, [fetchDashboardStats]);

  if (isLoading && !stats && mergedExpenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary.main} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary.main}
          />
        }
      >
        <TotalCountWidget
          count={stats?.totalRestaurantCount ?? 0}
          onPress={() => tabNav.navigate('Recommend', { screen: 'RecommendMain', params: { initialTab: 'my' } })}
        />

        <ExpenseCalendar
          year={year}
          month={month}
          dailyExpenses={mergedExpenses}
          monthlyTotal={mergedTotal}
          dailyAverage={mergedAverage}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDayPress={handleDayPress}
        />

        <BudgetProgressCard
          budgetGoal={budgetGoal}
          spent={mergedTotal}
          onSetBudget={() => setBudgetModalVisible(true)}
        />

        <TopVisitedWidget
          expenses={localExpenses}
          year={year}
          month={month}
        />

        <WeeklyMealStatsWidget expenses={localExpenses} />
      </ScrollView>

      <ExpenseInputModal
        visible={modalVisible}
        date={selectedDate}
        expenses={selectedDateExpenses}
        onSave={handleSaveExpense}
        onUpdate={handleUpdateExpense}
        onDelete={handleDeleteExpense}
        onClose={() => setModalVisible(false)}
      />

      <BudgetSettingModal
        visible={budgetModalVisible}
        currentBudget={budgetGoal}
        onSave={setBudgetGoal}
        onClose={() => setBudgetModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
