import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { borderRadius } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'large' | 'medium' | 'small';

interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const sizeStyles: Record<ButtonSize, { height: number; textStyle: TextStyle }> = {
  large: { height: 52, textStyle: { ...Typography.body1, fontWeight: '600' } },
  medium: { height: 44, textStyle: { ...Typography.body2, fontWeight: '600' } },
  small: { height: 36, textStyle: { ...Typography.caption, fontWeight: '600' } },
};

function getVariantStyles(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: Colors.light.primary.main,
        } as ViewStyle,
        text: { color: '#FFFFFF' } as TextStyle,
        loadingColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.light.primary.main,
        } as ViewStyle,
        text: { color: Colors.light.primary.main } as TextStyle,
        loadingColor: Colors.light.primary.main,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        } as ViewStyle,
        text: { color: Colors.light.neutral.textBody } as TextStyle,
        loadingColor: Colors.light.neutral.textBody,
      };
    case 'danger':
      return {
        container: {
          backgroundColor: Colors.light.semantic.error,
        } as ViewStyle,
        text: { color: '#FFFFFF' } as TextStyle,
        loadingColor: '#FFFFFF',
      };
  }
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const variantStyle = getVariantStyles(variant);
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { height: sizeStyle.height },
        variantStyle.container,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.loadingColor} />
      ) : (
        <Text style={[sizeStyle.textStyle, variantStyle.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
