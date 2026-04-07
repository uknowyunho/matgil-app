import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? Colors.light.semantic.error
    : isFocused
      ? Colors.light.primary.main
      : Colors.light.neutral.border;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, { borderColor }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.neutral.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.neutral.textBody,
    fontWeight: '600',
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: Colors.light.neutral.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.light.semantic.error,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.light.neutral.textSecondary,
  },
});
