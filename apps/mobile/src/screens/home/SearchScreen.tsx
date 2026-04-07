import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList, Restaurant } from '../../types';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { RestaurantCard } from '../../components/RestaurantCard';
import { EmptyState } from '../../components/EmptyState';

type SearchNavProp = NativeStackNavigationProp<HomeStackParamList, 'Search'>;

export function SearchScreen() {
  const navigation = useNavigation<SearchNavProp>();
  const { fetchRestaurants, restaurants, isLoading } = useRestaurantStore();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (text.trim().length === 0) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }
      setHasSearched(true);
      await fetchRestaurants({ search: text.trim() });
      setSearchResults(restaurants);
    },
    [fetchRestaurants, restaurants],
  );

  const handleRestaurantPress = useCallback(
    (restaurant: Restaurant) => {
      navigation.navigate('RestaurantDetail', { restaurantId: restaurant.id });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="맛집 이름 또는 주소로 검색"
          placeholderTextColor={Colors.light.neutral.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setSearchResults([]);
              setHasSearched(false);
            }}
          >
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => handleRestaurantPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          hasSearched ? (
            <EmptyState
              title="검색 결과가 없어요"
              description={`"${query}"에 대한 결과를 찾을 수 없습니다`}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
  },
  searchInput: {
    flex: 1,
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
  },
  clearButton: {
    ...Typography.body1,
    color: Colors.light.neutral.textSecondary,
    paddingLeft: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
});
