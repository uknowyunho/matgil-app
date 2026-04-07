import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAuthStore } from '../../store/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const pages = [
  {
    icon: '\uD83C\uDF7D',
    title: '맛집 기록',
    description: '나만의 맛집을 기록하고 관리하세요',
  },
  {
    icon: '\u2B50',
    title: '리뷰 작성',
    description: '방문 후기와 평점을 남겨보세요',
  },
  {
    icon: '\uD83D\uDC4D',
    title: '추천 받기',
    description: '취향에 맞는 맛집을 추천받으세요',
  },
];

export function OnboardingScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(currentPage + 1);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    await useAuthStore.getState().completeOnboarding();
    setIsLoading(false);
  };

  const isLastPage = currentPage === pages.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.page}>
            <Text style={styles.icon}>{page.icon}</Text>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotContainer}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentPage === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={isLastPage ? handleStart : handleNext}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '준비 중...' : isLastPage ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing['3xl'],
  },
  title: {
    ...Typography.title1,
    color: Colors.light.neutral.textTitle,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body1,
    color: Colors.light.neutral.textBody,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.xs,
  },
  dotActive: {
    backgroundColor: Colors.light.primary.main,
  },
  dotInactive: {
    backgroundColor: Colors.light.neutral.border,
  },
  button: {
    backgroundColor: Colors.light.primary.main,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['4xl'],
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
