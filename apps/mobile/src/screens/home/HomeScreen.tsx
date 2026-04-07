import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { HomeStackParamList } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { LogoMark } from '../../components/LogoMark';
import { DashboardView } from '../../components/dashboard/DashboardView';
import { useTheme } from '../../theme/ThemeProvider';

type HomeNavProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LogoMark size={28} />
          <Text style={[styles.title, { color: colors.neutral.textTitle }]}>맛길</Text>
        </View>
      </View>

      <DashboardView />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary.main }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RestaurantAdd')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...Typography.title1,
    color: Colors.light.neutral.textTitle,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing['3xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 30,
  },
});
