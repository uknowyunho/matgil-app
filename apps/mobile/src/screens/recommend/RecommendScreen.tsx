import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useNearbyStore } from '../../store/useNearbyStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useLocation } from '../../hooks/useLocation';
import type { RecommendStackParamList, NearbyRestaurant, NearbyBucket, Restaurant } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { RestaurantCard } from '../../components/RestaurantCard';
import { NearbyRestaurantCard } from '../../components/NearbyRestaurantCard';
import { SegmentedControl } from '../../components/SegmentedControl';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'nearby' | 'my';
type NearbyFilter = '500m' | '1km' | '3km';

const SEGMENTS = [
  { key: 'nearby' as const, label: '주변 식당' },
  { key: 'my' as const, label: '내 맛집' },
];

const NEARBY_FILTERS: { key: NearbyFilter; label: string }[] = [
  { key: '500m', label: '500m' },
  { key: '1km', label: '1km' },
  { key: '3km', label: '3km' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: '한식', label: '한식' },
  { key: '중식', label: '중식' },
  { key: '양식', label: '양식' },
  { key: '일식', label: '일식' },
  { key: '카페', label: '카페/디저트' },
  { key: '치킨', label: '치킨' },
  { key: '분식', label: '분식' },
];

function bucketsToSections(buckets: NearbyBucket[]) {
  return buckets
    .filter((b) => b.restaurants.length > 0)
    .map((b) => ({
      title: `${b.label} (${b.restaurants.length})`,
      data: b.restaurants,
    }));
}

export function RecommendScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecommendStackParamList>>();
  const route = useRoute<RouteProp<RecommendStackParamList, 'RecommendMain'>>();
  const { colors } = useTheme();
  const { location, error: locationError, isLoading: locationLoading, requestPermission } = useLocation();

  const {
    restaurants,
    isLoading: isMyLoading,
    fetchRestaurants,
  } = useRestaurantStore();

  const {
    buckets: nearbyBuckets,
    searchResults: nearbySearchResults,
    isLoading: isNearbyLoading,
    error: nearbyError,
    fetchNearby,
    searchNearby,
    clearSearch,
  } = useNearbyStore();

  const [activeTab, setActiveTab] = useState<TabKey>(route.params?.initialTab ?? 'nearby');
  const [nearbyFilter, setNearbyFilter] = useState<NearbyFilter>('3km');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [shuffledRestaurant, setShuffledRestaurant] = useState<NearbyRestaurant | null>(null);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [shuffledMyRestaurant, setShuffledMyRestaurant] = useState<Restaurant | null>(null);
  const [showMyShuffleModal, setShowMyShuffleModal] = useState(false);

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      setSearchQuery('');
      setIsSearching(false);
      clearSearch();
    }
  }, [route.params?.initialTab, clearSearch]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (location && activeTab === 'nearby' && !isSearching) {
      fetchNearby(location.latitude, location.longitude);
    }
  }, [location, activeTab, fetchNearby, isSearching]);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchRestaurants({ limit: 200, sortBy: 'recent' });
    }
  }, [activeTab, fetchRestaurants]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
    setSearchQuery('');
    setIsSearching(false);
    clearSearch();
  }, [clearSearch]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      clearSearch();
      return;
    }

    setIsSearching(true);
    if (activeTab === 'nearby') {
      await searchNearby(searchQuery, location?.latitude, location?.longitude);
    }
  }, [searchQuery, activeTab, location, searchNearby, clearSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    clearSearch();
  }, [clearSearch]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    navigation.navigate('RestaurantDetail', { restaurantId });
  }, [navigation]);

  const renderNearbyItem = useCallback(({ item }: { item: NearbyRestaurant }) => (
    <View style={styles.nearbyCardWrapper}>
      <NearbyRestaurantCard restaurant={item} />
    </View>
  ), []);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string; data: NearbyRestaurant[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.neutral.textTitle }]}>{section.title}</Text>
    </View>
  ), [colors.neutral.textTitle]);

  const lastMealMap = React.useMemo(() => {
    const expenses = useDashboardStore.getState().localExpenses;
    const map = new Map<string, { menuName: string; amount: number; date: string }>();
    for (const e of expenses) {
      if (!e.restaurantId || !e.memo) continue;
      const existing = map.get(e.restaurantId);
      if (!existing || e.date > existing.date) {
        const menuName = e.memo.includes(' @ ') ? e.memo.split(' @ ')[0] : e.memo;
        map.set(e.restaurantId, { menuName, amount: e.amount, date: e.date });
      }
    }
    return map;
  }, [restaurants]);

  const filteredMyRestaurants = React.useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categories.some(c => c.name.includes(searchQuery))
    );
  }, [restaurants, searchQuery]);

  const filteredBuckets = React.useMemo(() => {
    let result = nearbyBuckets.filter((b) => b.label === nearbyFilter);
    if (categoryFilter !== 'all') {
      result = result.map(bucket => ({
        ...bucket,
        restaurants: bucket.restaurants.filter(r => 
          r.categoryName.includes(categoryFilter)
        )
      }));
    }
    return result;
  }, [nearbyBuckets, nearbyFilter, categoryFilter]);

  const nearbySections = React.useMemo(
    () => bucketsToSections(filteredBuckets),
    [filteredBuckets],
  );

  const handleShuffle = useCallback(() => {
    const allRestaurants = isSearching ? nearbySearchResults : filteredBuckets.flatMap((b) => b.restaurants);
    if (allRestaurants.length === 0) return;
    const pick = allRestaurants[Math.floor(Math.random() * allRestaurants.length)];
    setShuffledRestaurant(pick);
    setShowShuffleModal(true);
  }, [filteredBuckets, isSearching, nearbySearchResults]);

  const handleMyShufflePress = useCallback(() => {
    const targetList = searchQuery ? filteredMyRestaurants : restaurants;
    if (targetList.length === 0) return;
    const pick = targetList[Math.floor(Math.random() * targetList.length)];
    setShuffledMyRestaurant(pick);
    setShowMyShuffleModal(true);
  }, [restaurants, filteredMyRestaurants, searchQuery]);

  const isLoading = activeTab === 'nearby' ? isNearbyLoading : isMyLoading;
  const subtitle = activeTab === 'nearby'
    ? '카카오 기반 주변 식당을 검색합니다'
    : '내가 저장한 맛집 목록이에요';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.neutral.textTitle }]}>오늘 뭐 먹지?</Text>
        <Text style={[styles.subtitle, { color: colors.neutral.textSecondary }]}>{subtitle}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder={activeTab === 'nearby' ? "동네 맛집 검색 (예: 강남역 고기집)" : "내 맛집 이름 또는 카테고리 검색"}
          value={searchQuery}
          onChangeText={(v) => {
            setSearchQuery(v);
            if (!v.trim()) handleClearSearch();
          }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          leftIcon={<Text style={{ fontSize: 16 }}>🔍</Text>}
          rightIcon={searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={{ fontSize: 16, color: colors.neutral.textSecondary }}>✕</Text>
            </TouchableOpacity>
          ) : undefined}
        />
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedControl
          segments={SEGMENTS}
          activeKey={activeTab}
          onChange={handleTabChange}
        />
      </View>

      {((activeTab === 'my' && filteredMyRestaurants.length > 0) || (activeTab === 'nearby' && isSearching && nearbySearchResults.length > 0)) && (
        <View style={styles.myShuffleRow}>
          <TouchableOpacity
            style={[styles.shuffleButton, { backgroundColor: colors.primary.main }]}
            onPress={activeTab === 'my' ? handleMyShufflePress : handleShuffle}
            activeOpacity={0.7}
          >
            <Text style={styles.shuffleButtonText}>🎲 랜덤 추천</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'nearby' && !isSearching && (
        <View style={styles.filterSection}>
          <View style={styles.filterHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: colors.neutral.textSecondary }]}>검색 반경</Text>
              <View style={styles.radiusButtons}>
                {NEARBY_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.radiusButton,
                      { backgroundColor: colors.neutral.card, borderColor: colors.neutral.border },
                      nearbyFilter === f.key && { backgroundColor: colors.primary.bg, borderColor: colors.primary.main },
                    ]}
                    onPress={() => setNearbyFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.radiusButtonText,
                        { color: colors.neutral.textBody },
                        nearbyFilter === f.key && { color: colors.primary.main, fontWeight: '600' },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.shuffleButton, { backgroundColor: colors.primary.main }]}
              onPress={handleShuffle}
              activeOpacity={0.7}
            >
              <Text style={styles.shuffleButtonText}>🎲 랜덤 추천</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryFilterContainer}>
            <Text style={[styles.filterLabel, { color: colors.neutral.textSecondary, marginBottom: spacing.sm }]}>카테고리</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORY_FILTERS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const isSelected = categoryFilter === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.neutral.card, borderColor: colors.neutral.border },
                      isSelected && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                    ]}
                    onPress={() => setCategoryFilter(item.key)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: colors.neutral.textBody },
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      )}

      <View style={styles.cardsContainer}>
        {activeTab === 'nearby' ? (
          locationError ? (
            <EmptyState title="위치를 가져올 수 없어요" description={locationError} />
          ) : (locationLoading || isNearbyLoading) && !isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={[styles.loadingText, { color: colors.neutral.textSecondary }]}>주변 식당을 찾고 있어요...</Text>
            </View>
          ) : nearbyError ? (
            <EmptyState title="검색에 실패했어요" description={nearbyError} />
          ) : isSearching ? (
            isNearbyLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <Text style={[styles.loadingText, { color: colors.neutral.textSecondary }]}>'{searchQuery}' 검색 중...</Text>
              </View>
            ) : nearbySearchResults.length === 0 ? (
              <EmptyState title="검색 결과가 없어요" description="다른 키워드로 검색해보세요" />
            ) : (
              <FlatList
                data={nearbySearchResults}
                keyExtractor={(item) => item.kakaoId}
                renderItem={renderNearbyItem}
                contentContainerStyle={styles.nearbyList}
                ListHeaderComponent={() => (
                  <View style={styles.searchResultHeader}>
                    <Text style={[styles.searchResultCount, { color: colors.neutral.textSecondary }]}>
                      검색 결과 <Text style={{ color: colors.primary.main }}>{nearbySearchResults.length}</Text>건
                    </Text>
                  </View>
                )}
              />
            )
          ) : nearbySections.length === 0 ? (
            <EmptyState title="조건에 맞는 식당이 없어요" description={categoryFilter === 'all' ? "반경을 넓혀보세요" : "다른 카테고리를 선택해보세요"} />
          ) : (
            <SectionList
              sections={nearbySections}
              keyExtractor={(item) => item.kakaoId}
              renderItem={renderNearbyItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.nearbyList}
              stickySectionHeadersEnabled={false}
            />
          )
        ) : (
          isMyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={[styles.loadingText, { color: colors.neutral.textSecondary }]}>맛집을 불러오는 중...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMyRestaurants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.myCardWrapper}>
                  <RestaurantCard
                    restaurant={item}
                    onPress={() => handleRestaurantPress(item.id)}
                    lastMeal={lastMealMap.get(item.id)}
                  />
                </View>
              )}
              contentContainerStyle={styles.myList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  title={searchQuery ? "일치하는 맛집이 없어요" : "저장된 맛집이 없어요"}
                  description={searchQuery ? "검색어를 확인해보세요" : "+ 버튼을 눌러 맛집을 추가해보세요"}
                />
              }
            />
          )
        )}
      </View>

      {activeTab === 'my' && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary.main }]} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('RestaurantAdd')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showShuffleModal} transparent animationType="fade" onRequestClose={() => setShowShuffleModal(false)}>
        <View style={styles.shuffleOverlay}>
          <TouchableOpacity style={styles.shuffleBackdrop} activeOpacity={1} onPress={() => setShowShuffleModal(false)} />
          <View style={[styles.shuffleCard, { backgroundColor: colors.neutral.card }]}>
            <Text style={styles.shuffleTitle}>오늘의 추천!</Text>
            {shuffledRestaurant && (
              <>
                <Text style={[styles.shuffleName, { color: colors.neutral.textTitle }]}>{shuffledRestaurant.name}</Text>
                <Text style={styles.shuffleCategory}>{shuffledRestaurant.categoryName.split(' > ').pop()}</Text>
                <Text style={[styles.shuffleAddress, { color: colors.neutral.textSecondary }]} numberOfLines={2}>{shuffledRestaurant.roadAddress || shuffledRestaurant.address}</Text>
                <View style={[styles.shuffleDistanceBadge, { backgroundColor: colors.primary.bg }]}>
                  <Text style={[styles.shuffleDistanceText, { color: colors.primary.main }]}>
                    {shuffledRestaurant.distance < 1000 ? `${shuffledRestaurant.distance}m` : `${(shuffledRestaurant.distance / 1000).toFixed(1)}km`}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.shuffleActions}>
              <TouchableOpacity style={[styles.shuffleTertiaryButton, { backgroundColor: colors.neutral.bg }]} onPress={handleShuffle}>
                <Text style={[styles.shuffleSecondaryText, { color: colors.neutral.textSecondary }]}>다시 뽑기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shufflePrimaryButton, { backgroundColor: colors.primary.main }]} 
                onPress={() => {
                  setShowShuffleModal(false);
                  Alert.alert('선택 완료', `'${shuffledRestaurant?.name}'(으)로 결정하셨네요!`);
                }}
              >
                <Text style={styles.shufflePrimaryText}>선택하기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shuffleSecondaryButton, { borderColor: colors.primary.main, borderWidth: 1 }]} 
                onPress={() => { setShowShuffleModal(false); if (shuffledRestaurant?.placeUrl) Linking.openURL(shuffledRestaurant.placeUrl); }}
              >
                <Text style={[styles.shuffleSecondaryText, { color: colors.primary.main }]}>자세히 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMyShuffleModal} transparent animationType="fade" onRequestClose={() => setShowMyShuffleModal(false)}>
        <View style={styles.shuffleOverlay}>
          <TouchableOpacity style={styles.shuffleBackdrop} activeOpacity={1} onPress={() => setShowMyShuffleModal(false)} />
          <View style={[styles.shuffleCard, { backgroundColor: colors.neutral.card }]}>
            <Text style={styles.shuffleTitle}>오늘의 추천!</Text>
            {shuffledMyRestaurant && (
              <>
                <Text style={[styles.shuffleName, { color: colors.neutral.textTitle }]}>{shuffledMyRestaurant.name}</Text>
                {shuffledMyRestaurant.categories.length > 0 && <Text style={styles.shuffleCategory}>{shuffledMyRestaurant.categories[0].name}</Text>}
                <Text style={[styles.shuffleAddress, { color: colors.neutral.textSecondary }]} numberOfLines={2}>{shuffledMyRestaurant.address}</Text>
                {shuffledMyRestaurant.rating != null && (
                  <View style={[styles.shuffleDistanceBadge, { backgroundColor: colors.primary.bg }]}>
                    <Text style={[styles.shuffleDistanceText, { color: colors.primary.main }]}>{'★'.repeat(Math.round(Number(shuffledMyRestaurant.rating)))} {Number(shuffledMyRestaurant.rating).toFixed(1)}</Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.shuffleActions}>
              <TouchableOpacity style={[styles.shuffleTertiaryButton, { backgroundColor: colors.neutral.bg }]} onPress={handleMyShufflePress}>
                <Text style={[styles.shuffleSecondaryText, { color: colors.neutral.textSecondary }]}>다시 뽑기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shufflePrimaryButton, { backgroundColor: colors.primary.main }]} 
                onPress={() => {
                  setShowMyShuffleModal(false);
                  Alert.alert('선택 완료', `'${shuffledMyRestaurant?.name}'(으)로 결정하셨네요!`);
                }}
              >
                <Text style={styles.shufflePrimaryText}>선택하기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shuffleSecondaryButton, { borderColor: colors.primary.main, borderWidth: 1 }]} 
                onPress={() => { setShowMyShuffleModal(false); if (shuffledMyRestaurant) navigation.navigate('RestaurantDetail', { restaurantId: shuffledMyRestaurant.id }); }}
              >
                <Text style={[styles.shuffleSecondaryText, { color: colors.primary.main }]}>자세히 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...Typography.display, marginBottom: spacing.xs },
  subtitle: { ...Typography.body2 },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchResultHeader: { paddingVertical: spacing.sm, marginBottom: spacing.xs },
  searchResultCount: { ...Typography.caption, fontWeight: '600' },
  segmentContainer: { paddingVertical: spacing.sm },
  myShuffleRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'flex-end' },
  filterSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.lg },
  filterHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  filterLabel: { ...Typography.caption, fontWeight: '600' },
  radiusButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  radiusButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  radiusButtonText: { ...Typography.caption },
  categoryFilterContainer: { marginTop: -spacing.xs },
  categoryList: { gap: spacing.sm, paddingRight: spacing.lg },
  categoryChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  categoryChipText: { ...Typography.caption },
  shuffleButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginBottom: 1 },
  shuffleButtonText: { ...Typography.caption, fontWeight: '700', color: '#FFFFFF' },
  cardsContainer: { flex: 1, justifyContent: 'center' },
  loadingContainer: { alignItems: 'center', gap: spacing.md },
  loadingText: { ...Typography.body2 },
  nearbyList: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { ...Typography.title2 },
  nearbyCardWrapper: { marginBottom: spacing.md },
  myList: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  myCardWrapper: {},
  shuffleOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  shuffleBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  shuffleCard: { width: SCREEN_WIDTH - spacing.lg * 2, borderRadius: borderRadius.xl, padding: spacing['2xl'], alignItems: 'center', gap: spacing.sm },
  shuffleTitle: { ...Typography.caption, color: Colors.light.primary.main, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  shuffleName: { ...Typography.title1, textAlign: 'center' },
  shuffleCategory: { ...Typography.body2, color: Colors.light.primary.main, fontWeight: '600' },
  shuffleAddress: { ...Typography.body2, textAlign: 'center' },
  shuffleDistanceBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: spacing.xs },
  shuffleDistanceText: { ...Typography.caption, fontWeight: '700' },
  shuffleActions: { flexDirection: 'column', gap: spacing.sm, marginTop: spacing.lg, width: '100%' },
  shufflePrimaryButton: { width: '100%', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  shuffleSecondaryButton: { width: '100%', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  shuffleTertiaryButton: { width: '100%', paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  shufflePrimaryText: { ...Typography.body2, fontWeight: '700', color: '#FFFFFF' },
  shuffleSecondaryText: { ...Typography.body2, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 32, right: spacing.lg, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  fabIcon: { fontSize: 28, fontWeight: '300', color: '#FFFFFF', lineHeight: 30 },
});
