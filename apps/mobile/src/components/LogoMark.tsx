import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface LogoMarkProps {
  size?: number;
}

/**
 * App logo mark — Tangerine squircle badge with a white "hot bowl + pin" symbol.
 *
 * Concept: "맛있는 발견" (Delicious Discovery)
 *   - Bowl (semicircle) = food / 맛집
 *   - Steam lines       = warmth / freshness
 *   - Pin tip (triangle) = location / discovery
 *
 * Follows LOGO-TRENDS.md Option A (Neo-minimalism, Warm Tangerine palette).
 */
export function LogoMark({ size = 28 }: LogoMarkProps) {
  const s = size;

  return (
    <View
      style={[
        styles.badge,
        {
          width: s,
          height: s,
          borderRadius: s * 0.26,
        },
      ]}
    >
      {/* Steam — 3 small rounded bars, centre one taller */}
      <View style={styles.steamRow}>
        <View
          style={[
            styles.steamLine,
            {
              width: s * 0.065,
              height: s * 0.14,
              borderRadius: s * 0.04,
              opacity: 0.75,
            },
          ]}
        />
        <View
          style={[
            styles.steamLine,
            {
              width: s * 0.065,
              height: s * 0.2,
              borderRadius: s * 0.04,
              opacity: 0.9,
            },
          ]}
        />
        <View
          style={[
            styles.steamLine,
            {
              width: s * 0.065,
              height: s * 0.14,
              borderRadius: s * 0.04,
              opacity: 0.75,
            },
          ]}
        />
      </View>

      {/* Bowl — rounded-bottom rectangle */}
      <View
        style={{
          width: s * 0.48,
          height: s * 0.22,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: s * 0.02,
          borderTopRightRadius: s * 0.02,
          borderBottomLeftRadius: s * 0.14,
          borderBottomRightRadius: s * 0.14,
        }}
      />

      {/* Pin tip — small inverted triangle via border trick */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.06,
          borderRightWidth: s * 0.06,
          borderTopWidth: s * 0.09,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.light.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft 3D — subtle inner shadow feel via shadow props
    shadowColor: Colors.light.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  steamRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 1,
  },
  steamLine: {
    backgroundColor: '#FFFFFF',
  },
});
