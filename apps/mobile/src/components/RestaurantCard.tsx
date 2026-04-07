import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import type { Restaurant } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { Rating } from './Rating';
import { CategoryChip } from './CategoryChip';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  lastMeal?: { menuName: string; amount: number; date: string };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }
  return dateStr;
}

export function RestaurantCard({ restaurant, onPress, lastMeal }: RestaurantCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {restaurant.thumbnailUrl ? (
          <Image
            source={{ uri: restaurant.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Name & Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {restaurant.rating != null && (
            <Rating value={restaurant.rating} size="sm" readonly />
          )}
        </View>

        {/* Address */}
        <Text style={styles.address} numberOfLines={1}>
          {restaurant.address}
        </Text>

        {/* Last Meal */}
        {lastMeal && (
          <Text style={styles.lastMeal} numberOfLines={1}>
            {lastMeal.menuName} · {formatAmount(lastMeal.amount)}원 ({formatShortDate(lastMeal.date)})
          </Text>
        )}

        {/* Category Chips */}
        {restaurant.categories.length > 0 && (
          <View style={styles.chipRow}>
            {restaurant.categories.slice(0, 3).map((cat) => (
              <CategoryChip
                key={cat.id}
                name={cat.name}
                color={cat.colorHex}
                selected
              />
            ))}
          </View>
        )}

        {/* Last Visited */}
        {restaurant.lastVisitedAt && (
          <Text style={styles.lastVisited}>
            마지막 방문: {formatDate(restaurant.lastVisitedAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailContainer: {
    height: 160,
    backgroundColor: Colors.light.neutral.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.card,
  },
  thumbnailPlaceholderText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
    flex: 1,
    marginRight: spacing.sm,
  },
  address: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  lastMeal: {
    ...Typography.caption,
    color: Colors.light.primary.main,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  lastVisited: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
});
