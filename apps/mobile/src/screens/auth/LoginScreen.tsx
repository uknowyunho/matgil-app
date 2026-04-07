import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../theme/ThemeProvider';
import { Typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const login = useAuthStore((s) => s.login);
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 글자별 애니메이션 값
  const anim1 = useRef(new Animated.Value(0)).current; // '맛'
  const anim2 = useRef(new Animated.Value(0)).current; // '길'
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSuccess) {
      // 순차적으로 통통 튀는 애니메이션 (Staggered Bounce)
      const createBounce = (val: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, {
              toValue: 1,
              duration: 800,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(val, {
              toValue: 0,
              duration: 800,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createBounce(anim1, 0),
        createBounce(anim2, 200), // 0.2초 차이로 '길'이 따라감
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSuccess]);

  // '맛' 글자 모션 계산
  const translateY1 = anim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -30, 0],
  });
  const scaleX1 = anim1.interpolate({
    inputRange: [0, 0.1, 0.5, 0.9, 1],
    outputRange: [1.2, 0.9, 1, 0.9, 1.2],
  });
  const rotate1 = anim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-10deg', '0deg'],
  });

  // '길' 글자 모션 계산
  const translateY2 = anim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -30, 0],
  });
  const scaleX2 = anim2.interpolate({
    inputRange: [0, 0.1, 0.5, 0.9, 1],
    outputRange: [1.2, 0.9, 1, 0.9, 1.2],
  });
  const rotate2 = anim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '10deg', '0deg'],
  });

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setLoginError('');

    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요');
      return;
    }
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요');
      return;
    }

    setIsLoggingIn(true);
    try {
      setIsSuccess(true);
      await login(email.trim(), password);
    } catch (err: any) {
      setLoginError('이메일 또는 비밀번호를 확인해주세요.');
      setIsLoggingIn(false);
      setIsSuccess(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.neutral.bg }]}>
        <Animated.View style={[styles.brandWrapper, { opacity: fadeValue }]}>
          {/* '맛' 글자 */}
          <Animated.View style={[
            styles.charContainer,
            { backgroundColor: colors.primary.main },
            { transform: [{ translateY: translateY1 }, { scaleX: scaleX1 }, { rotate: rotate1 }] }
          ]}>
            <Text style={styles.brandText}>맛</Text>
          </Animated.View>

          {/* '길' 글자 */}
          <Animated.View style={[
            styles.charContainer,
            { backgroundColor: colors.primary.main },
            { transform: [{ translateY: translateY2 }, { scaleX: scaleX2 }, { rotate: rotate2 }] }
          ]}>
            <Text style={styles.brandText}>길</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.loadingTextContainer, { opacity: fadeValue }]}>
          <Text style={[styles.loadingTitle, { color: colors.neutral.textTitle }]}>
            나만의 맛길을 찾는 중...
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.neutral.textSecondary }]}>
            금방 준비될 거예요! 조금만 기다려주세요.
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary.main }]}>맛길</Text>
          <Text style={[styles.subtitle, { color: colors.neutral.textSecondary }]}>나만의 맛집 지도를 만들어보세요</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이메일"
            placeholder="email@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (loginError) setLoginError('');
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoggingIn}
          />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (loginError) setLoginError('');
            }}
            error={passwordError}
            secureTextEntry
            editable={!isLoggingIn}
          />

          {!!loginError && (
            <Text style={[styles.errorText, { color: colors.semantic.error }]}>{loginError}</Text>
          )}

          <Button
            title="로그인"
            variant="primary"
            size="large"
            onPress={handleLogin}
            loading={isLoggingIn}
            disabled={isLoggingIn}
          />
        </View>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          disabled={isLoggingIn}
        >
          <Text style={[styles.registerText, { color: colors.neutral.textSecondary }]}>
            계정이 없으신가요? <Text style={[styles.registerTextBold, { color: colors.primary.main }]}>회원가입</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing['3xl'] },
  header: { alignItems: 'center', marginBottom: spacing['4xl'] },
  title: { ...Typography.display, marginBottom: spacing.sm },
  subtitle: { ...Typography.body1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  brandWrapper: {
    flexDirection: 'row',
    gap: spacing.md,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charContainer: {
    width: 80,
    height: 80,
    borderRadius: 24, // 둥글둥글한 귀여운 박스
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  brandText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingTextContainer: { 
    alignItems: 'center', 
    marginTop: spacing['2xl'], 
    gap: spacing.xs,
    paddingHorizontal: spacing['3xl'] 
  },
  loadingTitle: { ...Typography.title2, fontWeight: '800' },
  loadingSubtitle: { ...Typography.body2, textAlign: 'center', opacity: 0.7 },
  form: { gap: spacing.lg },
  errorText: { ...Typography.body2, textAlign: 'center', marginTop: -spacing.sm },
  registerLink: { alignItems: 'center', marginTop: spacing['3xl'] },
  registerText: { ...Typography.body2 },
  registerTextBold: { fontWeight: '600' },
});
