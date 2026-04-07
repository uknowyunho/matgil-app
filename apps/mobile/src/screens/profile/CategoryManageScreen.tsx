import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import type { Category } from '../../types';
import * as categoriesApi from '../../api/endpoints/categories';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const DEFAULT_COLORS = [
  '#E8663D', '#C93B3B', '#D4952B', '#3B7FC9',
  '#8B6EC0', '#2D8A56', '#D46BA3', '#9C9488',
];

export function CategoryManageScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.getCategories();
      const uniqueData: Category[] = [];
      const seenNames = new Set<string>();
      
      data.sort((a, b) => a.sortOrder - b.sortOrder).forEach(cat => {
        if (!seenNames.has(cat.name)) {
          seenNames.add(cat.name);
          uniqueData.push(cat);
        }
      });
      setCategories(uniqueData);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    if (categories.some(c => c.name === newName.trim())) {
      const msg = '이미 존재하는 카테고리 이름입니다.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('추가 실패', msg);
      return;
    }
    try {
      const maxSortOrder = categories.length > 0
        ? Math.max(...categories.map((c) => c.sortOrder))
        : -1;
      const category = await categoriesApi.createCategory({
        name: newName.trim(),
        colorHex: selectedColor,
        sortOrder: maxSortOrder + 1,
      });
      setCategories((prev) => [...prev, category]);
      setNewName('');
      setShowAddForm(false);
    } catch {
      Alert.alert('추가 실패', '다시 시도해주세요.');
    }
  }, [newName, selectedColor, categories]);

  const handleUpdate = useCallback(
    async (id: string) => {
      if (!editName.trim()) return;
      try {
        const updated = await categoriesApi.updateCategory(id, {
          name: editName.trim(),
        });
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        setEditingId(null);
        setEditName('');
      } catch {
        Alert.alert('수정 실패', '다시 시도해주세요.');
      }
    },
    [editName],
  );

  const handleDelete = useCallback((id: string, name: string) => {
    const deleteAction = async () => {
      try {
        await categoriesApi.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch {
        const msg = '삭제 실패. 다시 시도해주세요.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('삭제 실패', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`"${name}"을(를) 삭제하시겠습니까?`)) {
        deleteAction();
      }
    } else {
      Alert.alert('카테고리 삭제', `"${name}"을(를) 삭제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: deleteAction,
        },
      ]);
    }
  }, []);

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index <= 0) return;
      const current = categories[index];
      const above = categories[index - 1];
      try {
        const [updatedCurrent, updatedAbove] = await Promise.all([
          categoriesApi.updateCategory(current.id, { sortOrder: above.sortOrder }),
          categoriesApi.updateCategory(above.id, { sortOrder: current.sortOrder }),
        ]);
        setCategories((prev) => {
          const next = prev.map((c) => {
            if (c.id === current.id) return updatedCurrent;
            if (c.id === above.id) return updatedAbove;
            return c;
          });
          return next.sort((a, b) => a.sortOrder - b.sortOrder);
        });
      } catch {
        Alert.alert('순서 변경 실패', '다시 시도해주세요.');
      }
    },
    [categories],
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= categories.length - 1) return;
      const current = categories[index];
      const below = categories[index + 1];
      try {
        const [updatedCurrent, updatedBelow] = await Promise.all([
          categoriesApi.updateCategory(current.id, { sortOrder: below.sortOrder }),
          categoriesApi.updateCategory(below.id, { sortOrder: current.sortOrder }),
        ]);
        setCategories((prev) => {
          const next = prev.map((c) => {
            if (c.id === current.id) return updatedCurrent;
            if (c.id === below.id) return updatedBelow;
            return c;
          });
          return next.sort((a, b) => a.sortOrder - b.sortOrder);
        });
      } catch {
        Alert.alert('순서 변경 실패', '다시 시도해주세요.');
      }
    },
    [categories],
  );

  const startEditing = useCallback((category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  }, []);

  const renderCategory = useCallback(
    ({ item, index }: { item: Category; index: number }) => (
      <View style={styles.categoryItem}>
        <View style={[styles.colorDot, { backgroundColor: item.colorHex }]} />
        {editingId === item.id ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpdate(item.id)}
            >
              <Text style={styles.saveText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditingId(null)}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoryRow}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <Text style={[styles.orderText, index === 0 && styles.disabledText]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMoveDown(index)}
                disabled={index === categories.length - 1}
              >
                <Text style={[styles.orderText, index === categories.length - 1 && styles.disabledText]}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => startEditing(item)}
              >
                <Text style={styles.editText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ),
    [editingId, editName, handleUpdate, handleDelete, startEditing, handleMoveUp, handleMoveDown, categories],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 카테고리가 없습니다</Text>
          </View>
        }
      />

      {/* Add Category Form */}
      {showAddForm ? (
        <View style={styles.addForm}>
          <Input
            label="카테고리 이름"
            placeholder="새 카테고리 이름"
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.colorPicker}>
            {DEFAULT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
          <View style={styles.addFormButtons}>
            <Button
              title="추가"
              variant="primary"
              size="small"
              onPress={handleAdd}
            />
            <Button
              title="취소"
              variant="ghost"
              size="small"
              onPress={() => {
                setShowAddForm(false);
                setNewName('');
              }}
            />
          </View>
        </View>
      ) : (
        <View style={styles.addButtonContainer}>
          <Button
            title="+ 카테고리 추가"
            variant="primary"
            size="medium"
            onPress={() => setShowAddForm(true)}
          />
        </View>
      )}
    </View>
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editText: {
    ...Typography.caption,
    color: Colors.light.primary.main,
  },
  deleteText: {
    ...Typography.caption,
    color: Colors.light.semantic.error,
  },
  orderText: {
    ...Typography.caption,
    color: Colors.light.neutral.textBody,
  },
  disabledText: {
    color: Colors.light.neutral.border,
  },
  saveText: {
    ...Typography.caption,
    color: Colors.light.semantic.success,
    fontWeight: '600',
  },
  cancelText: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: spacing.sm,
    backgroundColor: Colors.light.neutral.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
  },
  emptyContainer: {
    padding: spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  addForm: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.neutral.border,
    gap: spacing.md,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.light.neutral.textTitle,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addButtonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.neutral.border,
  },
});
