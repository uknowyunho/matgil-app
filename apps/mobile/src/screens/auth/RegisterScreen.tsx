import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
  const register = useAuthStore((s) => s.register);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = '대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다';
    }

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsRegistering(true);
    console.log('Attempting register with:', { email, nickname });

    try {
      await register(email.trim(), password, nickname.trim());
      console.log('Register successful!');
    } catch (error: any) {
      console.error('Register failed error:', error);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';

      if (error.response?.status === 409) {
        errorMessage = '이미 가입된 이메일입니다.';
      } else if (error.response?.data?.error?.message) {
        const backendMessage = error.response.data.error.message;
        if (Array.isArray(backendMessage)) {
          errorMessage = backendMessage.join('\n');
        } else {
          errorMessage = backendMessage;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
      }

      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>맛집 기록을 시작해보세요</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이메일"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="비밀번호"
            placeholder="영문 대/소문자, 숫자, 특수문자 포함 8자 이상"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
          />
          <Input
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChangeText={setNickname}
            error={errors.nickname}
          />
          <Button
            title="회원가입"
            variant="primary"
            size="large"
            onPress={handleRegister}
            loading={isRegistering}
          />
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.loginText}>
            이미 계정이 있으신가요? <Text style={styles.loginTextBold}>로그인</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.neutral.bg,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  title: {
    ...Typography.title1,
    color: Colors.light.neutral.textTitle,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.light.neutral.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  loginText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
  loginTextBold: {
    color: Colors.light.primary.main,
    fontWeight: '600',
  },
});
