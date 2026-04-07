import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import type { HomeStackParamList, NearbyRestaurant } from '../../types';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useLocation } from '../../hooks/useLocation';
import * as imagesApi from '../../api/endpoints/images';
import * as nearbyApi from '../../api/endpoints/nearby';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Rating } from '../../components/Rating';
import { CategoryChip } from '../../components/CategoryChip';
import { MEAL_TYPES as MEAL_TYPE_CONFIGS, type MealType } from '../../constants/mealTypes';
import * as categoriesApi from '../../api/endpoints/categories';
import type { Category } from '../../types';

interface MenuItem {
  id: string;
  date: string;
  price: string;
  menuName: string;
  mealType: MealType;
}

const MEAL_TYPES: { key: MealType; label: string }[] = MEAL_TYPE_CONFIGS.map((mt) => ({
  key: mt.type,
  label: mt.label,
}));

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

let menuIdCounter = 0;

type AddNavProp = NativeStackNavigationProp<HomeStackParamList, 'RestaurantAdd'>;


export function RestaurantAddScreen() {
  const navigation = useNavigation<AddNavProp>();
  const { createRestaurant } = useRestaurantStore();
  const { location } = useLocation();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [rating, setRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [serverCategories, setServerCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoriesApi.getCategories().then((cats) => {
      // 이름 기준 중복 제거 (첫 번째만 유지)
      const seen = new Set<string>();
      const unique = cats.filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      });
      setServerCategories(unique);
    }).catch(() => {});
  }, []);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NearbyRestaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_IMAGES = 3;
  const isSavingRef = useRef(false);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      searchTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await nearbyApi.searchKeyword(
            query.trim(),
            location?.latitude,
            location?.longitude,
          );
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [location],
  );

  const handleSelectPlace = useCallback((place: NearbyRestaurant) => {
    setName(place.name);
    setAddress(place.roadAddress || place.address);
    setPhone(place.phone);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const pickImages = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  const addMenuItem = useCallback(() => {
    setMenuItems((prev) => [
      ...prev,
      { id: `menu-${++menuIdCounter}`, date: getTodayString(), price: '', menuName: '', mealType: 'lunch' as MealType },
    ]);
  }, []);

  const removeMenuItem = useCallback((id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateMenuItem = useCallback(
    (id: string, field: keyof Omit<MenuItem, 'id'>, value: string) => {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (isSavingRef.current) return;

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!address.trim()) newErrors.address = '주소를 입력해주세요';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const restaurant = await createRestaurant({
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        phone: phone.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        categoryIds: selectedCategories,
      });

      // Upload images
      for (let i = 0; i < images.length; i++) {
        try {
          await imagesApi.uploadImage(restaurant.id, images[i], i);
        } catch (imgErr) {
          console.warn('Image upload failed:', imgErr);
        }
      }

      for (const item of menuItems) {
        const amount = parseInt(item.price, 10);
        if (item.date && amount > 0 && item.menuName.trim()) {
          useDashboardStore.getState().addFoodExpense({
            date: item.date,
            amount,
            memo: `${item.menuName.trim()} @ ${name.trim()}`,
            mealType: item.mealType,
            restaurantId: restaurant.id,
          });
        }
      }

      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message
        ?? err?.message
        ?? '알 수 없는 오류';
      console.error('Restaurant save error:', err);
      Alert.alert('저장 실패', msg);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [name, address, phone, latitude, longitude, rating, selectedCategories, images, menuItems, createRestaurant, navigation]);

  const renderSearchItem = useCallback(
    ({ item }: { item: NearbyRestaurant }) => (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => handleSelectPlace(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.searchResultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.searchResultAddress} numberOfLines={1}>
          {item.roadAddress || item.address}
        </Text>
        {item.phone ? (
          <Text style={styles.searchResultPhone}>{item.phone}</Text>
        ) : null}
        {item.distance > 0 && (
          <Text style={styles.searchResultDistance}>
            {item.distance < 1000
              ? `${item.distance}m`
              : `${(item.distance / 1000).toFixed(1)}km`}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [handleSelectPlace],
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Image Picker Area */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScrollContent}
            keyboardShouldPersistTaps="always"
          >
            {images.map((uri, index) => (
              <View key={uri} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
                <Text style={styles.imagePickerText}>+</Text>
                <Text style={styles.imagePickerLabel}>
                  사진 추가 ({images.length}/{MAX_IMAGES})
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name + Search Button */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>이름</Text>
            <View style={styles.nameRow}>
              <View style={styles.nameInputWrapper}>
                <Input
                  placeholder="맛집 이름을 입력하세요"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                />
              </View>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  setSearchQuery(name);
                  setSearchModalVisible(true);
                  if (name.trim().length >= 2) {
                    handleSearch(name);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="주소"
            placeholder="주소를 검색으로 자동입력하세요"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
          />

          <Input
            label="전화번호"
            placeholder="전화번호를 입력하세요 (선택)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Category Multi-select */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>카테고리</Text>
            <View style={styles.chipRow}>
              {serverCategories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  name={cat.name}
                  color={cat.colorHex}
                  selected={selectedCategories.includes(cat.id)}
                  onPress={() => toggleCategory(cat.id)}
                />
              ))}
            </View>
          </View>

          {/* Rating */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>평점</Text>
            <Rating value={rating} onChange={setRating} size="lg" />
          </View>

          {/* 먹은 메뉴 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>먹은 메뉴</Text>
            {menuItems.map((item) => (
              <View key={item.id} style={styles.menuCard}>
                <TouchableOpacity
                  style={styles.menuRemoveButton}
                  onPress={() => removeMenuItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.menuRemoveText}>✕</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.menuInput}
                  placeholder="메뉴명"
                  placeholderTextColor={Colors.light.neutral.textSecondary}
                  value={item.menuName}
                  onChangeText={(v) => updateMenuItem(item.id, 'menuName', v)}
                />
                <View style={styles.menuRow}>
                  <TextInput
                    style={[styles.menuInput, styles.menuInputHalf]}
                    placeholder="날짜 (YYYY-MM-DD)"
                    placeholderTextColor={Colors.light.neutral.textSecondary}
                    value={item.date}
                    onChangeText={(v) => updateMenuItem(item.id, 'date', v)}
                  />
                  <TextInput
                    style={[styles.menuInput, styles.menuInputHalf]}
                    placeholder="금액 (원)"
                    placeholderTextColor={Colors.light.neutral.textSecondary}
                    value={item.price}
                    onChangeText={(v) => updateMenuItem(item.id, 'price', v)}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.mealTypeRow}>
                  {MEAL_TYPES.map((mt) => (
                    <TouchableOpacity
                      key={mt.key}
                      style={[
                        styles.mealTypeChip,
                        item.mealType === mt.key && styles.mealTypeChipActive,
                      ]}
                      onPress={() =>
                        setMenuItems((prev) =>
                          prev.map((m) =>
                            m.id === item.id ? { ...m, mealType: mt.key } : m,
                          ),
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.mealTypeChipText,
                          item.mealType === mt.key && styles.mealTypeChipTextActive,
                        ]}
                      >
                        {mt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addMenuButton} onPress={addMenuItem}>
              <Text style={styles.addMenuButtonText}>+ 메뉴 추가</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Save Button */}
      <View style={styles.saveButtonContainer}>
        <Button
          title="저장하기"
          variant="primary"
          size="large"
          onPress={handleSave}
          loading={isSaving}
        />
      </View>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>식당 검색</Text>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Text style={styles.modalClose}>닫기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchBar}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="식당 이름을 검색하세요"
              placeholderTextColor={Colors.light.neutral.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {isSearching ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator
                size="large"
                color={Colors.light.primary.main}
              />
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.kakaoId}
              renderItem={renderSearchItem}
              contentContainerStyle={styles.searchResultList}
              keyboardShouldPersistTaps="handled"
            />
          ) : searchQuery.trim().length >= 2 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>검색 결과가 없습니다</Text>
            </View>
          ) : (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>
                식당 이름을 2글자 이상 입력해주세요
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  saveButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
    backgroundColor: Colors.light.neutral.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.neutral.border,
  },
  imageSection: {
    marginTop: spacing.lg,
  },
  imageScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageThumb: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.xl,
    backgroundColor: Colors.light.neutral.card,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imagePicker: {
    width: 140,
    height: 140,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 28,
    color: Colors.light.neutral.textSecondary,
  },
  imagePickerLabel: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.light.neutral.textBody,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  nameInputWrapper: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: Colors.light.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginTop: 1,
  },
  searchButtonText: {
    ...Typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    position: 'relative',
  },
  menuRemoveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuRemoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.neutral.textBody,
  },
  menuInput: {
    padding: spacing.md,
    backgroundColor: Colors.light.neutral.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
  },
  menuRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  menuInputHalf: {
    flex: 1,
    minWidth: 0,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.light.neutral.bg,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
  },
  mealTypeChipActive: {
    backgroundColor: Colors.light.primary.bg,
    borderColor: Colors.light.primary.main,
  },
  mealTypeChipText: {
    ...Typography.caption,
    color: Colors.light.neutral.textBody,
  },
  mealTypeChipTextActive: {
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
  addMenuButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.primary.main,
    alignItems: 'center',
  },
  addMenuButtonText: {
    ...Typography.body1,
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
  // Search Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
  },
  modalClose: {
    ...Typography.body1,
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
  modalSearchBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalSearchInput: {
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  searchResultList: {
    paddingHorizontal: spacing.lg,
  },
  searchResultItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.neutral.border,
    gap: 2,
  },
  searchResultName: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.light.neutral.textTitle,
  },
  searchResultAddress: {
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
  },
  searchResultPhone: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  searchResultDistance: {
    ...Typography.caption,
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
});
