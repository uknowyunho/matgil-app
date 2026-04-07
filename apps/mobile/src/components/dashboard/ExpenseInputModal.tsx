import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LocalExpense } from '../../store/useDashboardStore';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { MEAL_TYPES, MEAL_TYPE_COLOR_MAP } from '../../constants/mealTypes';
import { useTheme } from '../../theme/ThemeProvider';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import type { HomeStackParamList } from '../../types';

interface ExpenseInputModalProps {
  visible: boolean;
  date: string;
  expenses: LocalExpense[];
  onSave: (amount: number, memo: string, mealType?: string, restaurantId?: string, isCorporate?: boolean) => void;
  onUpdate: (id: string, amount: number, memo: string, mealType?: string, restaurantId?: string, isCorporate?: boolean) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatDisplayAmount(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

const FOOD_CATEGORIES = ['한식', '양식', '중식', '일식'];

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export function ExpenseInputModal({
  visible,
  date,
  expenses,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: ExpenseInputModalProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>();
  const [isCorporate, setIsCorporate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);

  const { restaurants, fetchRestaurants, createRestaurant } = useRestaurantStore();

  // 검색어에 따른 식당 필터링
  const filteredRestaurants = restaurantSearch.trim()
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(restaurantSearch.toLowerCase()),
      )
    : [];

  // 모달 열릴 때 레스토랑 목록 로드
  useEffect(() => {
    if (visible && restaurants.length === 0) {
      fetchRestaurants({ limit: 100, sortBy: 'recent' });
    }
  }, [visible, restaurants.length, fetchRestaurants]);

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!visible) {
      setAmount('');
      setSelectedMealType(undefined);
      setSelectedCategory(undefined);
      setRestaurantSearch('');
      setSelectedRestaurantId(undefined);
      setIsCorporate(false);
      setEditingId(null);
      setPendingDeleteAll(false);
    }
  }, [visible]);

  const handleDeleteAllToggle = () => {
    setPendingDeleteAll(true);
    setEditingId(null);
    setAmount('');
    setSelectedMealType(undefined);
    setSelectedCategory(undefined);
    setRestaurantSearch('');
    setSelectedRestaurantId(undefined);
  };

  const handleDeleteAllConfirm = () => {
    for (const expense of expenses) {
      onDelete(expense.id);
    }
    setPendingDeleteAll(false);
    setAmount('');
    onClose();
  };

  const handleSave = async () => {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const memo = selectedCategory || '';
    
    let finalRestaurantId = selectedRestaurantId;
    
    // 1. 선택된 ID가 없는데 검색어(이름)는 입력된 경우
    if (!finalRestaurantId && restaurantSearch.trim()) {
      const trimmedName = restaurantSearch.trim();
      const exactMatch = restaurants.find(r => r.name === trimmedName);
      
      if (exactMatch) {
        finalRestaurantId = exactMatch.id;
      } else {
        // 2. 아예 새로운 이름인 경우 '내 맛집'에 신규 등록
        try {
          const newRest = await createRestaurant({
            name: trimmedName,
            address: '위치 정보 없음 (상세 페이지에서 수정)',
            latitude: 37.5665,
            longitude: 126.9780,
            memo: '대시보드에서 자동 등록된 맛집입니다.',
          });
          finalRestaurantId = newRest.id;
        } catch (error) {
          console.error('새 맛집 등록 실패:', error);
        }
      }
    }

    if (editingId) {
      onUpdate(editingId, parsedAmount, memo, selectedMealType, finalRestaurantId, isCorporate);
    } else {
      onSave(parsedAmount, memo, selectedMealType, finalRestaurantId, isCorporate);
    }
    handleClose();
  };

  const handleCreateAndEdit = async () => {
    const trimmedName = restaurantSearch.trim();
    if (!trimmedName) return;

    try {
      const newRest = await createRestaurant({
        name: trimmedName,
        address: '위치 정보 검색이 필요합니다',
        latitude: 37.5665,
        longitude: 126.9780,
        memo: '대시보드에서 등록 중입니다.',
      });
      setSelectedRestaurantId(newRest.id);
      
      // 상세 정보 입력을 위해 편집 화면으로 이동
      onClose();
      navigation.navigate('RestaurantEdit', { restaurantId: newRest.id });
    } catch (error) {
      Alert.alert('오류', '식당 등록에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setAmount('');
    setSelectedMealType(undefined);
    setSelectedCategory(undefined);
    setRestaurantSearch('');
    setSelectedRestaurantId(undefined);
    setIsCorporate(false);
    setEditingId(null);
    setPendingDeleteAll(false);
    onClose();
  };

  const handleEditPress = (expense: LocalExpense) => {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setSelectedMealType(expense.mealType);
    setSelectedRestaurantId(expense.restaurantId);
    setIsCorporate(expense.isCorporate ?? false);
    
    // 식당 이름 복원
    if (expense.restaurantId) {
      const r = restaurants.find(res => res.id === expense.restaurantId);
      if (r) setRestaurantSearch(r.name);
    } else {
      setRestaurantSearch('');
    }
    
    // memo 필드에 카테고리가 저장되어 있다고 가정
    if (expense.memo && FOOD_CATEGORIES.includes(expense.memo)) {
      setSelectedCategory(expense.memo);
    } else {
      setSelectedCategory(undefined);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setSelectedMealType(undefined);
    setSelectedCategory(undefined);
    setRestaurantSearch('');
    setSelectedRestaurantId(undefined);
    setIsCorporate(false);
  };

  const handleDeletePress = (expense: LocalExpense) => {
    onDelete(expense.id);
    if (editingId === expense.id) {
      setEditingId(null);
      setAmount('');
      setRestaurantSearch('');
      setSelectedRestaurantId(undefined);
    }
  };

  const handleRestaurantSelect = (id: string, name: string) => {
    setSelectedRestaurantId(id);
    setRestaurantSearch(name);
  };

  const getRestaurantName = (restaurantId?: string) => {
    if (!restaurantId) return null;
    return restaurants.find((r) => r.id === restaurantId)?.name ?? null;
  };

  // 날짜 표시용 포맷
  const parts = date.split('-');
  const displayDate =
    parts.length === 3 ? `${parts[1]}월 ${parseInt(parts[2], 10)}일` : date;

  const isFormValid =
    pendingDeleteAll || (amount.length > 0 && parseInt(amount, 10) > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.neutral.bg }]}>
          <View style={[styles.handle, { backgroundColor: colors.neutral.border }]} />
          <Text style={[styles.title, { color: colors.neutral.textTitle }]}>{displayDate}</Text>

          {/* ── 기존 식비 목록 ── */}
          {expenses.length > 0 && (
            <View style={styles.listSection}>
              <Text style={[styles.sectionLabel, { color: colors.neutral.textSecondary }]}>입력된 식비</Text>
              <ScrollView
                style={styles.listScroll}
                showsVerticalScrollIndicator={false}
              >
                {expenses.map((expense) => {
                  const restaurantName = getRestaurantName(expense.restaurantId);
                  return (
                    <View
                      key={expense.id}
                      style={[
                        styles.expenseRow,
                        { backgroundColor: colors.neutral.card },
                        editingId === expense.id && { borderColor: colors.primary.main, borderWidth: 1.5 },
                      ]}
                    >
                      <View style={styles.expenseInfo}>
                        <View style={styles.expenseHeader}>
                          <Text style={[styles.expenseAmount, { color: colors.neutral.textTitle }]}>
                            {formatDisplayAmount(expense.amount)}
                          </Text>
                          {expense.isCorporate && (
                            <View style={[styles.corpBadge, { backgroundColor: colors.semantic.info + '26' }]}>
                              <Text style={[styles.corpBadgeText, { color: colors.semantic.info }]}>법카</Text>
                            </View>
                          )}
                          {expense.mealType ? (
                            <View
                              style={[
                                styles.mealTypeBadge,
                                {
                                  backgroundColor:
                                    MEAL_TYPE_COLOR_MAP[expense.mealType] ??
                                    '#999',
                                },
                              ]}
                            >
                              <Text style={styles.mealTypeBadgeText}>
                                {MEAL_TYPES.find(
                                  (mt) => mt.type === expense.mealType,
                                )?.label ?? expense.mealType}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {restaurantName ? (
                          <Text style={[styles.expenseRestaurant, { color: colors.primary.main }]} numberOfLines={1}>
                            🍽 {restaurantName}
                          </Text>
                        ) : null}
                        {expense.memo ? (
                          <Text style={[styles.expenseMemo, { color: colors.neutral.textSecondary }]} numberOfLines={1}>
                            {expense.memo}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.expenseActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditPress(expense)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={[styles.editButtonText, { color: colors.primary.main }]}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeletePress(expense)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={[styles.deleteButtonText, { color: colors.semantic.error }]}>삭제</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── 구분선 ── */}
          {expenses.length > 0 && <View style={[styles.divider, { backgroundColor: colors.neutral.border }]} />}

          {/* ── 입력 폼 ── */}
          <Text style={[styles.sectionLabel, { color: colors.neutral.textSecondary }]}>
            {pendingDeleteAll
              ? '식비 삭제'
              : editingId
                ? '식비 수정'
                : '새 식비 추가'}
          </Text>

          {pendingDeleteAll ? (
            <View style={[styles.deleteAllNotice, { backgroundColor: colors.semantic.error + '14' }]}>
              <Text style={[styles.deleteAllNoticeText, { color: colors.semantic.error }]}>
                이 날의 식비 {expenses.length}건이 모두 삭제됩니다.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
            >
              {/* ── 금액 ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.neutral.textSecondary }]}>금액</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.neutral.card }]}>
                  <TextInput
                    style={[styles.inputFlex, { color: colors.neutral.textTitle }]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="금액을 입력하세요"
                    placeholderTextColor={colors.neutral.textSecondary}
                    keyboardType="number-pad"
                    autoFocus={expenses.length === 0}
                  />
                  {amount.length > 0 && (
                    <TouchableOpacity
                      style={[styles.clearButton, { backgroundColor: colors.neutral.border }]}
                      onPress={() => setAmount('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.clearButtonText, { color: colors.neutral.textSecondary }]}>X</Text>
                    </TouchableOpacity>
                  )}
                  {expenses.length > 0 && (
                    <TouchableOpacity
                      style={styles.deleteAllButton}
                      onPress={handleDeleteAllToggle}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.deleteAllButtonText, { color: colors.semantic.error }]}>전체 삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ── 법카 토글 ── */}
              <TouchableOpacity
                style={[styles.corpToggleRow, { backgroundColor: colors.neutral.card }]}
                onPress={() => setIsCorporate((v) => !v)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.label, { color: colors.neutral.textSecondary }]}>법인카드</Text>
                  <Text style={[styles.corpToggleDesc, { color: colors.neutral.textSecondary }]}>법카로 결제한 식비는 집계에서 제외할 수 있어요</Text>
                </View>
                <View style={[styles.corpToggle, { backgroundColor: colors.neutral.border }, isCorporate && { backgroundColor: '#3B82F6' }]}>
                  <View style={[styles.corpToggleThumb, isCorporate && styles.corpToggleThumbOn]} />
                </View>
              </TouchableOpacity>

              {/* ── 식사 타입 ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.neutral.textSecondary }]}>식사</Text>
                <View style={styles.mealTypeContainer}>
                  {MEAL_TYPES.map(({ type, label, color }) => {
                    const selected = selectedMealType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.mealTypeChip,
                          { backgroundColor: colors.neutral.card },
                          selected && { backgroundColor: color },
                        ]}
                        onPress={() =>
                          setSelectedMealType(selected ? undefined : type)
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.mealTypeChipText,
                            { color: colors.neutral.textBody },
                            selected && styles.mealTypeChipTextSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── 음식 카테고리 ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.neutral.textSecondary }]}>카테고리</Text>
                <View style={styles.categoryContainer}>
                  {FOOD_CATEGORIES.map((cat) => {
                    const selected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: colors.neutral.card },
                          selected && { backgroundColor: colors.primary.main },
                        ]}
                        onPress={() =>
                          setSelectedCategory(selected ? undefined : cat)
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: colors.neutral.textBody },
                            selected && styles.categoryChipTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── 아는맛(식당) 선택 ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.neutral.textSecondary }]}>식당</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.neutral.card }]}>
                  <TextInput
                    style={[styles.inputFlex, { color: colors.neutral.textTitle }]}
                    value={restaurantSearch}
                    onChangeText={(text) => {
                      setRestaurantSearch(text);
                      setSelectedRestaurantId(undefined); // 텍스트 변경 시 선택된 ID 초기화
                    }}
                    placeholder="식당명을 입력하세요"
                    placeholderTextColor={colors.neutral.textSecondary}
                  />
                  {restaurantSearch.length > 0 && (
                    <TouchableOpacity
                      style={[styles.clearButton, { backgroundColor: colors.neutral.border }]}
                      onPress={() => {
                        setRestaurantSearch('');
                        setSelectedRestaurantId(undefined);
                      }}
                    >
                      <Text style={[styles.clearButtonText, { color: colors.neutral.textSecondary }]}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 검색 결과가 없을 때 새로운 식당 등록 제안 (박스 형태) */}
                {restaurantSearch.trim().length > 0 && !selectedRestaurantId && filteredRestaurants.length === 0 && (
                  <TouchableOpacity
                    style={[styles.newRestaurantCard, { backgroundColor: colors.primary.bg, borderColor: colors.primary.main }]}
                    onPress={handleCreateAndEdit}
                    activeOpacity={0.8}
                  >
                    <View style={styles.newRestaurantContent}>
                      <Text style={[styles.newRestaurantIcon, { color: colors.primary.main }]}>🍽</Text>
                      <View style={styles.newRestaurantInfo}>
                        <Text style={[styles.newRestaurantName, { color: colors.neutral.textTitle }]}>
                          "{restaurantSearch.trim()}"
                        </Text>
                        <Text style={[styles.newRestaurantLabel, { color: colors.primary.main }]}>
                          새로운 맛집으로 등록하기
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.newRestaurantBadge, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.newRestaurantBadgeText}>추가 정보 입력</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 검색 제안 목록 */}
                {filteredRestaurants.length > 0 && !selectedRestaurantId && (
                  <View style={[styles.suggestionContainer, { backgroundColor: colors.neutral.card }]}>
                    {filteredRestaurants.slice(0, 3).map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={styles.suggestionItem}
                        onPress={() => handleRestaurantSelect(r.id, r.name)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.neutral.textBody }]}>
                          🍽 {r.name} <Text style={{ color: colors.primary.main, fontSize: 10 }}>(내 맛집)</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {selectedRestaurantId && (
                  <View style={styles.linkedNotice}>
                    <Text style={[styles.linkedNoticeText, { color: colors.primary.main }]}>
                      ✓ '내 맛집' 기록과 연동되었습니다.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.neutral.card }]}
              onPress={
                pendingDeleteAll
                  ? () => setPendingDeleteAll(false)
                  : editingId
                    ? handleCancelEdit
                    : handleClose
              }
            >
              <Text style={[styles.cancelText, { color: colors.neutral.textBody }]}>
                {pendingDeleteAll
                  ? '취소'
                  : editingId
                    ? '수정 취소'
                    : '닫기'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                pendingDeleteAll
                  ? [styles.deleteConfirmButton, { backgroundColor: colors.semantic.error }]
                  : [styles.saveButton, { backgroundColor: colors.primary.main }],
                !isFormValid && styles.saveButtonDisabled,
              ]}
              onPress={pendingDeleteAll ? handleDeleteAllConfirm : handleSave}
              disabled={!isFormValid}
            >
              <Text style={styles.saveText}>
                {pendingDeleteAll
                  ? '전체 삭제'
                  : editingId
                    ? '수정'
                    : '저장'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
    gap: spacing.md,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  title: {
    ...Typography.title2,
  },

  // ── 기존 목록 ──
  listSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listScroll: {
    maxHeight: 160,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
    marginRight: spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expenseAmount: {
    ...Typography.body1,
    fontWeight: '600',
  },
  mealTypeBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mealTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expenseRestaurant: {
    ...Typography.caption,
    fontWeight: '600',
  },
  expenseMemo: {
    ...Typography.caption,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  deleteButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // ── 구분선 ──
  divider: {
    height: 1,
  },

  // ── 입력 폼 ──
  formScroll: {
    maxHeight: 320,
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    ...Typography.caption,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  inputFlex: {
    ...Typography.body1,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  deleteAllButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  deleteAllNotice: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAllNoticeText: {
    ...Typography.body2,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },

  // ── 법인카드 ──
  corpBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  corpBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  corpToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  corpToggleDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  corpToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  corpToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  corpToggleThumbOn: {
    transform: [{ translateX: 18 }],
  },

  // ── 식사 타입 ──
  mealTypeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  mealTypeChip: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealTypeChipTextSelected: {
    color: '#FFFFFF',
  },

  // ── 음식 카테고리 ──
  categoryContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  categoryChip: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  // ── 식당 선택 ──
  suggestionContainer: {
    marginTop: 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  suggestionItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    fontSize: 13,
  },
  linkedNotice: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  linkedNoticeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── 새 식당 카드 (박스 형태) ──
  newRestaurantCard: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newRestaurantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  newRestaurantIcon: {
    fontSize: 20,
  },
  newRestaurantInfo: {
    flex: 1,
    gap: 2,
  },
  newRestaurantName: {
    ...Typography.body1,
    fontWeight: '700',
  },
  newRestaurantLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  newRestaurantBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  newRestaurantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  restaurantRowText: {
    ...Typography.body2,
    flex: 1,
  },

  // ── 버튼 ──
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body1,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...Typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
