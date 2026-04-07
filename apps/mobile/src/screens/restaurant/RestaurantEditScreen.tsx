import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image as RNImage,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import type { HomeStackParamList, Category } from '../../types';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import * as categoriesApi from '../../api/endpoints/categories';
import * as imagesApi from '../../api/endpoints/images';
import { resizeImage, uploadToS3, getFileSize } from '../../utils/imageUpload';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Rating } from '../../components/Rating';
import { CategoryChip } from '../../components/CategoryChip';
import { MEAL_TYPES as MEAL_TYPE_CONFIGS, type MealType } from '../../constants/mealTypes';

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

type EditRouteProp = RouteProp<HomeStackParamList, 'RestaurantEdit'>;
type EditNavProp = NativeStackNavigationProp<HomeStackParamList, 'RestaurantEdit'>;

export function RestaurantEditScreen() {
  const route = useRoute<EditRouteProp>();
  const navigation = useNavigation<EditNavProp>();
  const { selectedRestaurant, isLoading, fetchRestaurant, updateRestaurant, deleteRestaurant } =
    useRestaurantStore();
  const { restaurantId } = route.params;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string }>>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [serverCategories, setServerCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchRestaurant(restaurantId);
    categoriesApi.getCategories().then((cats) => {
      const seen = new Set<string>();
      const unique = cats.filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      });
      setServerCategories(unique);
    }).catch(() => {});
  }, [restaurantId, fetchRestaurant]);

  useEffect(() => {
    if (selectedRestaurant) {
      setName(selectedRestaurant.name);
      setAddress(selectedRestaurant.address);
      setPhone(selectedRestaurant.phone ?? '');
      setMemo(selectedRestaurant.memo ?? '');
      setRating(selectedRestaurant.rating ?? 0);
      setSelectedCategories(selectedRestaurant.categories.map((c) => c.id));
      setExistingImages(
        (selectedRestaurant.images ?? []).map((img) => ({ id: img.id, url: img.url }))
      );
    }
  }, [selectedRestaurant]);

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

  const handleDeleteImage = useCallback(async (imageId: string) => {
    try {
      await imagesApi.deleteImage(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      Alert.alert('삭제 실패', '다시 시도해주세요.');
    }
  }, []);

  const pickNewImages = useCallback(async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= 3) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - totalImages,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(asset => asset.uri);
      setNewImages(prev => [...prev, ...uris].slice(0, 3 - existingImages.length));
    }
  }, [existingImages.length, newImages.length]);

  const handleSave = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!address.trim()) newErrors.address = '주소를 입력해주세요';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateRestaurant(restaurantId, {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        memo: memo.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        categoryIds: selectedCategories,
      });

      // Upload new images
      for (let i = 0; i < newImages.length; i++) {
        try {
          const resized = await resizeImage(newImages[i]);
          const fileSize = await getFileSize(resized.uri);
          const fileName = `image_${i}.jpg`;
          const mimeType = 'image/jpeg';

          const presigned = await imagesApi.getPresignedUrl(restaurantId, [
            { fileName, mimeType },
          ]);

          if (presigned.urls.length > 0) {
            await uploadToS3(presigned.urls[0].uploadUrl, resized.uri, mimeType);
            await imagesApi.registerImage(restaurantId, {
              s3Key: presigned.urls[0].s3Key,
              fileName,
              mimeType,
              fileSize,
              sortOrder: existingImages.length + i,
            });
          }
        } catch {
          // silently fail for individual image uploads
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
            restaurantId,
          });
        }
      }

      navigation.goBack();
    } catch {
      Alert.alert('수정 실패', '다시 시도해주세요.');
    }
  }, [name, address, phone, memo, rating, selectedCategories, newImages, existingImages.length, menuItems, updateRestaurant, restaurantId, navigation]);

  const handleDelete = useCallback(() => {
    const doDelete = async () => {
      try {
        await deleteRestaurant(restaurantId);
        navigation.popToTop();
      } catch {
        Alert.alert('삭제 실패', '다시 시도해주세요.');
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('정말 삭제하시겠습니까?')) {
        doDelete();
      }
    } else {
      Alert.alert('맛집 삭제', '정말 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [deleteRestaurant, restaurantId, navigation]);

  if (isLoading && !selectedRestaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image Section */}
      <View style={styles.imageSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContent}
        >
          {existingImages.map((img) => (
            <View key={img.id} style={styles.imageWrapper}>
              <RNImage source={{ uri: img.url }} style={styles.imageThumb} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleDeleteImage(img.id)}
              >
                <Text style={styles.removeImageText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          {newImages.map((uri, index) => (
            <View key={`new-${index}`} style={styles.imageWrapper}>
              <RNImage source={{ uri }} style={styles.imageThumb} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setNewImages(prev => prev.filter((_, i) => i !== index))}
              >
                <Text style={styles.removeImageText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          {existingImages.length + newImages.length < 3 && (
            <TouchableOpacity style={styles.imagePicker} onPress={pickNewImages}>
              <Text style={styles.imagePickerText}>+</Text>
              <Text style={styles.imagePickerLabel}>사진 추가</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Input
          label="이름"
          placeholder="맛집 이름을 입력하세요"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <Input
          label="주소"
          placeholder="주소를 입력하세요"
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

        {/* Memo */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>메모</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="메모를 입력하세요 (선택)"
            placeholderTextColor={Colors.light.neutral.textSecondary}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
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

        {/* Action Buttons */}
        <Button
          title="수정하기"
          variant="primary"
          size="large"
          onPress={handleSave}
          loading={isLoading}
        />
        <Button
          title="삭제하기"
          variant="danger"
          size="medium"
          onPress={handleDelete}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  contentContainer: {
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.bg,
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
  removeImageButton: {
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
  removeImageText: {
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
    fontSize: 32,
    color: Colors.light.neutral.textSecondary,
  },
  imagePickerLabel: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
    marginTop: spacing.xs,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memoInput: {
    minHeight: 100,
    padding: spacing.md,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
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
});
