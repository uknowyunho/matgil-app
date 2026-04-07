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
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface BudgetSettingModalProps {
  visible: boolean;
  currentBudget: number | null;
  onSave: (amount: number | null) => void;
  onClose: () => void;
}

const QUICK_OPTIONS = [
  { label: '20만', value: 200000 },
  { label: '30만', value: 300000 },
  { label: '50만', value: 500000 },
];

export function BudgetSettingModal({
  visible,
  currentBudget,
  onSave,
  onClose,
}: BudgetSettingModalProps) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(currentBudget != null ? String(currentBudget) : '');
    }
  }, [visible, currentBudget]);

  const handleQuickSelect = (value: number) => {
    setAmount(String(value));
  };

  const handleSave = () => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    onSave(parsed);
    onClose();
  };

  const handleRemoveBudget = () => {
    onSave(null);
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const isValid = amount.length > 0 && parseInt(amount, 10) > 0;

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
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>월별 예산 설정</Text>

          {/* Amount input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>목표 금액</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputFlex}
                value={amount}
                onChangeText={setAmount}
                placeholder="금액을 입력하세요"
                placeholderTextColor={Colors.light.neutral.textSecondary}
                keyboardType="number-pad"
                autoFocus
              />
              {amount.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setAmount('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick select */}
          <View style={styles.quickRow}>
            {QUICK_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.quickButton,
                  amount === String(opt.value) && styles.quickButtonActive,
                ]}
                onPress={() => handleQuickSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    amount === String(opt.value) &&
                      styles.quickButtonTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.saveText}>저장</Text>
            </TouchableOpacity>
          </View>

          {/* Remove budget */}
          {currentBudget != null && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveBudget}
            >
              <Text style={styles.removeText}>예산 해제</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: Colors.light.neutral.bg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.neutral.border,
    alignSelf: 'center',
  },
  title: {
    ...Typography.title2,
    color: Colors.light.neutral.textTitle,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
  },
  inputFlex: {
    ...Typography.body1,
    color: Colors.light.neutral.textTitle,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.neutral.textSecondary,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.light.neutral.card,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: Colors.light.primary.main,
  },
  quickButtonText: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.light.neutral.textBody,
  },
  quickButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.light.neutral.card,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.light.neutral.textBody,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.light.primary.main,
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
  removeButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  removeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.semantic.error,
  },
});
