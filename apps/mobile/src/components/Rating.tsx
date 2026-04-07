import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { Colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type RatingSize = 'sm' | 'md' | 'lg';

interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: RatingSize;
  readonly?: boolean;
}

const SIZE_MAP: Record<RatingSize, number> = {
  sm: 16,
  md: 22,
  lg: 30,
};

export function Rating({
  value,
  onChange,
  size = 'md',
  readonly = false,
}: RatingProps) {
  const starSize = SIZE_MAP[size];
  const isInteractive = !readonly && !!onChange;

  const handlePress = useCallback(
    (star: number) => {
      if (isInteractive && onChange) {
        onChange(star);
      }
    },
    [isInteractive, onChange],
  );

  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const StarWrapper = isInteractive ? TouchableOpacity : View;

        return (
          <StarWrapper
            key={star}
            onPress={isInteractive ? () => handlePress(star) : undefined}
            style={styles.starWrapper}
          >
            <Text
              style={[
                {
                  fontSize: starSize,
                  color: filled
                    ? Colors.light.primary.main
                    : Colors.light.neutral.border,
                },
              ]}
            >
              {filled ? '\u2605' : '\u2606'}
            </Text>
          </StarWrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starWrapper: {
    padding: 2,
  },
});
