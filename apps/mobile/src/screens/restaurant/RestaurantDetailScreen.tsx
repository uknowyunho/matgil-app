import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList, Review, FoodExpense } from '../../types';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useReviewStore } from '../../store/useReviewStore';
import * as dashboardApi from '../../api/endpoints/dashboard';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { Rating } from '../../components/Rating';
import { MEAL_TYPES } from '../../constants/mealTypes';
import { CategoryChip } from '../../components/CategoryChip';
import { ReviewCard } from '../../components/ReviewCard';
import { ReviewForm } from '../../components/ReviewForm';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DetailRouteProp = RouteProp<HomeStackParamList, 'RestaurantDetail'>;
type DetailNavProp = NativeStackNavigationProp<HomeStackParamList, 'RestaurantDetail'>;

export function RestaurantDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavProp>();
  const { colors } = useTheme();
  const { selectedRestaurant, isLoading, fetchRestaurant, updateRestaurant, deleteRestaurant } =
    useRestaurantStore();
  const {
    reviews,
    isLoading: reviewsLoading,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
  } = useReviewStore();
  const { restaurantId } = route.params;

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mealHistory, setMealHistory] = useState<FoodExpense[]>([]);
  const [mealHistoryLoading, setMealHistoryLoading] = useState(false);

  useEffect(() => {
    fetchRestaurant(restaurantId);
    fetchReviews(restaurantId);
    setMealHistoryLoading(true);
    dashboardApi
      .getExpensesByRestaurant(restaurantId)
      .then(setMealHistory)
      .catch(() => {})
      .finally(() => setMealHistoryLoading(false));
  }, [restaurantId, fetchRestaurant, fetchReviews]);

  const handleEdit = useCallback(() => {
    navigation.navigate('RestaurantEdit', { restaurantId });
  }, [navigation, restaurantId]);

  const handleDelete = useCallback(() => {
    const doDelete = async () => {
      try {
        await deleteRestaurant(restaurantId);
        navigation.popToTop();
      } catch {
        if (Platform.OS === 'web') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (global as any).alert('삭제 실패. 다시 시도해주세요.');
        } else {
          Alert.alert('삭제 실패', '다시 시도해주세요.');
        }
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((global as any).confirm('이 맛집을 삭제하시겠습니까?')) {
        doDelete();
      }
    } else {
      Alert.alert('맛집 삭제', '이 맛집을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [deleteRestaurant, restaurantId, navigation]);

  const handleCall = useCallback(() => {
    if (selectedRestaurant?.phone) {
      Linking.openURL(`tel:${selectedRestaurant.phone}`);
    }
  }, [selectedRestaurant]);

  const handleCreateReview = useCallback(() => {
    setEditingReview(null);
    setShowReviewForm(true);
  }, []);

  const handleEditReview = useCallback((review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  }, []);

  const handleDeleteReview = useCallback(
    (reviewId: string) => {
      Alert.alert('리뷰 삭제', '이 리뷰를 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId);
              fetchReviews(restaurantId);
            } catch {
              Alert.alert('삭제 실패', '다시 시도해주세요.');
            }
          },
        },
      ]);
    },
    [deleteReview, fetchReviews, restaurantId],
  );

  const handleReviewSubmit = useCallback(
    async (data: {
      content: string;
      rating: number;
      visitedDate?: string;
      amount?: number;
    }) => {
      try {
        if (editingReview) {
          await updateReview(editingReview.id, data);
        } else {
          await createReview(restaurantId, data);
          await updateRestaurant(restaurantId, {
            lastVisitedAt: new Date().toISOString(),
          });
        }
        setShowReviewForm(false);
        setEditingReview(null);
        fetchReviews(restaurantId);
      } catch {
        Alert.alert('저장 실패', '다시 시도해주세요.');
      }
    },
    [
      editingReview,
      createReview,
      updateReview,
      updateRestaurant,
      fetchReviews,
      restaurantId,
    ],
  );

  const handleReviewCancel = useCallback(() => {
    setShowReviewForm(false);
    setEditingReview(null);
  }, []);

  if (isLoading || !selectedRestaurant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.neutral.bg }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.neutral.bg }]} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {selectedRestaurant.images && selectedRestaurant.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(idx);
                }}
              >
                {selectedRestaurant.images.map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.url }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {selectedRestaurant.images.length > 1 && (
                <View style={styles.imageIndicator}>
                  {selectedRestaurant.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.imageDot,
                        currentImageIndex === index
                          ? styles.imageDotActive
                          : styles.imageDotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Name, Edit, Delete */}
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.neutral.textTitle }]}>{selectedRestaurant.name}</Text>
            <View style={styles.titleButtons}>
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating */}
          {selectedRestaurant.rating != null && (
            <View style={styles.ratingContainer}>
              <Rating value={Number(selectedRestaurant.rating)} size="md" readonly />
              <Text style={styles.ratingText}>
                {Number(selectedRestaurant.rating).toFixed(1)}
              </Text>
            </View>
          )}

          {/* Category Chips */}
          {selectedRestaurant.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {selectedRestaurant.categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  name={cat.name}
                  color={cat.colorHex}
                  selected
                />
              ))}
            </View>
          )}

          {/* Address */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>주소</Text>
            <Text style={styles.infoValue}>{selectedRestaurant.address}</Text>
          </View>

          {/* Phone */}
          {selectedRestaurant.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
              <Text style={styles.infoLabel}>전화</Text>
              <Text style={[styles.infoValue, styles.phoneLink]}>
                {selectedRestaurant.phone}
              </Text>
            </TouchableOpacity>
          )}

          {/* Memo */}
          {selectedRestaurant.memo && (
            <View style={styles.memoContainer}>
              <Text style={styles.infoLabel}>메모</Text>
              <Text style={styles.memoText}>{selectedRestaurant.memo}</Text>
            </View>
          )}

          {/* Meal History Section */}
          <View style={styles.mealHistorySection}>
            <Text style={styles.sectionTitle}>식사 기록</Text>
            {mealHistoryLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary.main}
                style={styles.reviewsLoading}
              />
            ) : mealHistory.length === 0 ? (
              <View style={styles.reviewPlaceholder}>
                <Text style={styles.reviewPlaceholderText}>
                  아직 식사 기록이 없습니다
                </Text>
              </View>
            ) : (
              <View style={styles.mealHistoryList}>
                {mealHistory.map((expense) => {
                  const mealLabel = MEAL_TYPES.find((mt) => mt.type === expense.mealType)?.label ?? '';
                  const menuName = expense.memo?.includes(' @ ')
                    ? expense.memo.split(' @ ')[0]
                    : expense.memo ?? '';
                  return (
                    <View key={expense.id} style={styles.mealHistoryItem}>
                      <View style={styles.mealHistoryLeft}>
                        <Text style={styles.mealHistoryMenu} numberOfLines={1}>
                          {menuName}
                        </Text>
                        <Text style={styles.mealHistoryDate}>
                          {expense.date}{mealLabel ? ` · ${mealLabel}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.mealHistoryAmount}>
                        {expense.amount.toLocaleString('ko-KR')}원
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsSectionHeader}>
              <Text style={styles.sectionTitle}>리뷰</Text>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={handleCreateReview}
              >
                <Text style={styles.addReviewButtonText}>리뷰 작성</Text>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary.main}
                style={styles.reviewsLoading}
              />
            ) : reviews.length === 0 ? (
              <View style={styles.reviewPlaceholder}>
                <Text style={styles.reviewPlaceholderText}>
                  아직 작성된 리뷰가 없습니다
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onEdit={() => handleEditReview(review)}
                    onDelete={() => handleDeleteReview(review.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <ReviewForm
        visible={showReviewForm}
        initialData={
          editingReview
            ? {
                content: editingReview.content,
                rating: editingReview.rating,
                visitedDate: editingReview.visitedDate,
                amount: editingReview.amount,
              }
            : undefined
        }
        onSubmit={handleReviewSubmit}
        onCancel={handleReviewCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.bg,
  },
  imageCarousel: {
    width: SCREEN_WIDTH,
    height: 250,
    backgroundColor: Colors.light.neutral.card,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  imageDotActive: {
    backgroundColor: Colors.light.primary.main,
  },
  imageDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    ...Typography.body1,
    color: Colors.light.neutral.textSecondary,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...Typography.title1,
    color: Colors.light.neutral.textTitle,
    flex: 1,
  },
  titleButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
  },
  editButtonText: {
    ...Typography.caption,
    color: Colors.light.neutral.textBody,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.semantic.error,
  },
  deleteButtonText: {
    ...Typography.caption,
    color: Colors.light.semantic.error,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ratingText: {
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.neutral.border,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    width: 48,
    marginRight: spacing.md,
  },
  infoValue: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    flex: 1,
  },
  phoneLink: {
    color: Colors.light.primary.main,
  },
  memoContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.neutral.border,
  },
  memoText: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  mealHistorySection: {
    marginTop: spacing.xl,
  },
  mealHistoryList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  mealHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
  },
  mealHistoryLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  mealHistoryMenu: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
    fontWeight: '500',
  },
  mealHistoryDate: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    marginTop: 2,
  },
  mealHistoryAmount: {
    ...Typography.body2,
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: spacing.xl,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
  },
  addReviewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.light.primary.main,
  },
  addReviewButtonText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewPlaceholder: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
  },
  reviewPlaceholderText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  reviewsLoading: {
    paddingVertical: spacing.xl,
  },
  reviewsList: {
    gap: spacing.md,
  },
});
