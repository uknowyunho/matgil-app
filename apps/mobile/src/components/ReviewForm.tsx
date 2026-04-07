import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { Rating } from './Rating';
import { Button } from './Button';

interface ReviewFormData {
  content: string;
  rating: number;
  visitedDate?: string;
  amount?: number;
}

interface ReviewFormProps {
  visible: boolean;
  initialData?: ReviewFormData;
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ReviewForm({
  visible,
  initialData,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating ?? 0);
  const [content, setContent] = useState(initialData?.content ?? '');
  const [visitedDate, setVisitedDate] = useState(
    initialData?.visitedDate ?? getTodayString(),
  );
  const [amountText, setAmountText] = useState(
    initialData?.amount != null ? String(initialData.amount) : '',
  );

  useEffect(() => {
    if (visible) {
      setRating(initialData?.rating ?? 0);
      setContent(initialData?.content ?? '');
      setVisitedDate(initialData?.visitedDate ?? getTodayString());
      setAmountText(
        initialData?.amount != null ? String(initialData.amount) : '',
      );
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    const data: ReviewFormData = {
      content,
      rating,
    };
    if (visitedDate.trim()) {
      data.visitedDate = visitedDate.trim();
    }
    if (amountText.trim()) {
      const parsed = parseInt(amountText.trim(), 10);
      if (!isNaN(parsed)) {
        data.amount = parsed;
      }
    }
    onSubmit(data);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {initialData ? '리뷰 수정' : '리뷰 작성'}
            </Text>

            {/* Rating */}
            <View style={styles.field}>
              <Text style={styles.label}>평점</Text>
              <Rating value={rating} onChange={setRating} size="lg" />
            </View>

            {/* Content */}
            <View style={styles.field}>
              <Text style={styles.label}>내용</Text>
              <TextInput
                style={styles.textArea}
                value={content}
                onChangeText={setContent}
                placeholder="리뷰 내용을 입력하세요"
                placeholderTextColor={Colors.light.neutral.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Visited Date */}
            <View style={styles.field}>
              <Text style={styles.label}>방문일</Text>
              <TextInput
                style={styles.input}
                value={visitedDate}
                onChangeText={setVisitedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.neutral.textSecondary}
              />
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>금액 (원)</Text>
              <TextInput
                style={styles.input}
                value={amountText}
                onChangeText={setAmountText}
                placeholder="예: 15000"
                placeholderTextColor={Colors.light.neutral.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <View style={styles.buttonWrapper}>
                <Button title="저장" variant="primary" onPress={handleSubmit} />
              </View>
              <View style={styles.buttonWrapper}>
                <Button title="취소" variant="ghost" onPress={onCancel} />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: Colors.light.neutral.bg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  scrollContent: {
    padding: spacing.xl,
  },
  title: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 120,
    padding: spacing.md,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.neutral.border,
    ...Typography.body2,
    color: Colors.light.neutral.textBody,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonWrapper: {
    width: '100%',
  },
});
