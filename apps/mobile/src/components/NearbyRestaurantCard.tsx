import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';

import type { NearbyRestaurant } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { useTheme } from '../theme/ThemeProvider';

interface NearbyRestaurantCardProps {
  restaurant: NearbyRestaurant;
}

function extractLeafCategory(categoryName: string): string {
  const parts = categoryName.split(' > ');
  return parts[parts.length - 1] || categoryName;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function NearbyRestaurantCard({ restaurant }: NearbyRestaurantCardProps) {
  const { colors } = useTheme();
  const { restaurants, createRestaurant } = useRestaurantStore();
  const [isAdding, setIsAdding] = useState(false);

  // 이미 저장된 식당인지 확인
  const isSaved = restaurants.some(
    (r) => 
      r.name === restaurant.name && 
      (r.address === restaurant.roadAddress || r.address === restaurant.address)
  );

  const handlePress = () => {
    if (restaurant.placeUrl) {
      Linking.openURL(restaurant.placeUrl);
    }
  };

  const handleAddToMyRestaurants = async (e: any) => {
    e.stopPropagation(); // 카드 전체 클릭 이벤트 방지
    if (isSaved || isAdding) return;

    setIsAdding(true);
    try {
      await createRestaurant({
        name: restaurant.name,
        address: restaurant.roadAddress || restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        phone: restaurant.phone || undefined,
        memo: '주변 검색을 통해 추가된 맛집입니다.',
        categoryIds: [], // 초기 카테고리는 비어있음
      });
      Alert.alert('저장 완료', `'${restaurant.name}'이(가) 내 맛집에 추가되었습니다.`);
    } catch (error) {
      Alert.alert('저장 실패', '내 맛집 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.neutral.card }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, { color: colors.neutral.textTitle }]} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <Text style={[styles.category, { color: colors.primary.main }]}>
                {extractLeafCategory(restaurant.categoryName)}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={[styles.distanceBadge, { backgroundColor: colors.primary.main }]}>
                <Text style={styles.distanceText}>
                  {formatDistance(restaurant.distance)}
                </Text>
              </View>
            </View>
          </View>

          {restaurant.roadAddress ? (
            <Text style={[styles.address, { color: colors.neutral.textSecondary }]} numberOfLines={1}>
              {restaurant.roadAddress}
            </Text>
          ) : (
            <Text style={[styles.address, { color: colors.neutral.textSecondary }]} numberOfLines={1}>
              {restaurant.address}
            </Text>
          )}

          <View style={styles.bottomRow}>
            {restaurant.phone ? (
              <Text style={[styles.phone, { color: colors.neutral.textBody }]}>{restaurant.phone}</Text>
            ) : <View />}
            
            <TouchableOpacity
              style={[
                styles.addButton,
                { borderColor: colors.primary.main, backgroundColor: isSaved ? colors.primary.main : colors.primary.bg },
                isAdding && { opacity: 0.7 }
              ]}
              onPress={handleAddToMyRestaurants}
              disabled={isSaved || isAdding}
              activeOpacity={0.7}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <Text style={[
                  styles.addButtonText,
                  { color: isSaved ? '#FFFFFF' : colors.primary.main }
                ]}>
                  {isSaved ? '✓ 저장됨' : '+ 맛집 추가'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  nameContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...Typography.title2,
    marginBottom: 2,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  distanceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  distanceText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  category: {
    ...Typography.caption,
    fontWeight: '600',
  },
  address: {
    ...Typography.body2,
    marginBottom: spacing.xs,
  },
  phone: {
    ...Typography.body2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addButton: {
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
