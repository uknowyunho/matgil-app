import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProfileStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useLocation } from '../../hooks/useLocation';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, borderRadius } from '../../theme/spacing';
import { Button } from '../../components/Button';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface MenuItemProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  colors: any;
}

function MenuItem({ label, onPress, destructive, colors }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.neutral.border }]} onPress={onPress}>
      <Text style={[
        styles.menuItemText, 
        { color: colors.neutral.textBody },
        destructive && { color: colors.semantic.error }
      ]}>{label}</Text>
      <Text style={[styles.menuItemArrow, { color: colors.neutral.textSecondary }]}>{'>'}</Text>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout, updateProfile, deleteAccount } = useAuthStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { colors } = useTheme();
  const { location, requestPermission } = useLocation();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

  const handleStartEditNickname = useCallback(() => {
    setEditNickname(user?.nickname ?? '');
    setIsEditingNickname(true);
  }, [user]);

  const handleSaveNickname = useCallback(async () => {
    if (!editNickname.trim()) return;
    try {
      await updateProfile({ nickname: editNickname.trim() });
      setIsEditingNickname(false);
    } catch {
      Alert.alert('수정 실패', '다시 시도해주세요.');
    }
  }, [editNickname, updateProfile]);

  const handleDeleteAccount = useCallback(() => {
    const performDelete = async () => {
      try {
        await deleteAccount();
        // deleteAccount logic in useAuthStore will clear tokens and set isAuthenticated to false,
        // which triggers RootNavigator to show Auth stack (LoginScreen).
      } catch {
        const msg = '삭제 실패. 다시 시도해주세요.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('삭제 실패', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('정말 계정을 삭제하시겠습니까?\n모든 데이터가 영구 삭제되며 되돌릴 수 없습니다.')) {
        performDelete();
      }
    } else {
      Alert.alert('계정 삭제', '정말 계정을 삭제하시겠습니까?\n모든 데이터가 삭제됩니다.', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert('최종 확인', '이 작업은 되돌릴 수 없습니다.', [
              { text: '취소', style: 'cancel' },
              {
                text: '계정 삭제',
                style: 'destructive',
                onPress: performDelete,
              },
            ]);
          },
        },
      ]);
    }
  }, [deleteAccount]);

  const handleThemeChange = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsThemeModalVisible(true);
    } else {
      Alert.alert('테마 설정', '테마를 선택하세요', [
        {
          text: '라이트',
          onPress: () => setThemeMode('light'),
        },
        {
          text: '다크',
          onPress: () => setThemeMode('dark'),
        },
        {
          text: '시스템 설정',
          onPress: () => setThemeMode('system'),
        },
        { text: '취소', style: 'cancel' },
      ]);
    }
  }, [setThemeMode]);

  const handleSetDefaultLocation = useCallback(async () => {
    try {
      if (!location) {
        await requestPermission();
      }
      const coords = location;
      if (!coords) {
        const msg = '현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('위치 오류', msg);
        return;
      }
      await updateProfile({ latitude: coords.latitude, longitude: coords.longitude });
      const successMsg = '현재 위치가 기본 위치로 저장되었습니다.';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('기본 위치 설정', successMsg);
    } catch {
      const errorMsg = '다시 시도해주세요.';
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('설정 실패', errorMsg);
    }
  }, [location, requestPermission, updateProfile]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.neutral.textTitle }]}>프로필</Text>
        </View>

        {/* User Info */}
        <View style={[styles.userCard, { backgroundColor: colors.neutral.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary.bg }]}>
            <Text style={[styles.avatarText, { color: colors.primary.main }]}>
              {user?.nickname?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            {isEditingNickname ? (
              <View style={styles.nicknameEditRow}>
                <TextInput
                  style={[styles.nicknameInput, { backgroundColor: colors.neutral.bg, borderColor: colors.neutral.border, color: colors.neutral.textBody }]}
                  value={editNickname}
                  onChangeText={setEditNickname}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveNickname} style={styles.nicknameSaveButton}>
                  <Text style={[styles.nicknameSaveText, { color: colors.semantic.success }]}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingNickname(false)} style={styles.nicknameCancelButton}>
                  <Text style={[styles.nicknameCancelText, { color: colors.neutral.textSecondary }]}>취소</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleStartEditNickname}>
                <Text style={[styles.userName, { color: colors.neutral.textTitle }]}>{user?.nickname ?? '사용자'}</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.userEmail, { color: colors.neutral.textSecondary }]}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: colors.neutral.card }]}>
          <MenuItem
            label="카테고리 관리"
            onPress={() => navigation.navigate('CategoryManage')}
            colors={colors}
          />
          <MenuItem
            label="테마 설정"
            onPress={handleThemeChange}
            colors={colors}
          />
          <MenuItem
            label="기본 위치 설정"
            onPress={handleSetDefaultLocation}
            colors={colors}
          />
          <MenuItem
            label="알림 설정"
            onPress={() => Alert.alert('알림 설정', '준비 중입니다')}
            colors={colors}
          />
          <MenuItem
            label="데이터 백업"
            onPress={() => Alert.alert('데이터 백업', '준비 중입니다')}
            colors={colors}
          />
          <MenuItem
            label="앱 정보"
            onPress={() => Alert.alert('맛집', 'Version 0.1.0')}
            colors={colors}
          />
          <MenuItem
            label="계정 삭제"
            onPress={handleDeleteAccount}
            destructive
            colors={colors}
          />
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="로그아웃"
            variant="ghost"
            size="medium"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={isThemeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsThemeModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsThemeModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.neutral.card }]}>
            <Text style={[styles.modalTitle, { color: colors.neutral.textTitle }]}>테마 설정</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setThemeMode('light');
                setIsThemeModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, { color: colors.neutral.textBody }, themeMode === 'light' && styles.modalOptionSelected]}>라이트 모드</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setThemeMode('dark');
                setIsThemeModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, { color: colors.neutral.textBody }, themeMode === 'dark' && styles.modalOptionSelected]}>다크 모드</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setThemeMode('system');
                setIsThemeModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, { color: colors.neutral.textBody }, themeMode === 'system' && styles.modalOptionSelected]}>시스템 설정</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsThemeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...Typography.title1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.title1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.title2,
  },
  userEmail: {
    ...Typography.body2,
    marginTop: spacing.xs,
  },
  menuSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  menuItemText: {
    ...Typography.body1,
  },
  menuItemArrow: {
    ...Typography.body1,
  },
  nicknameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nicknameInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    ...Typography.body1,
  },
  nicknameSaveButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nicknameSaveText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  nicknameCancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nicknameCancelText: {
    ...Typography.caption,
  },
  logoutSection: {
    marginTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.title2,
    marginBottom: spacing.xl,
  },
  modalOption: {
    width: '100%',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalOptionText: {
    ...Typography.body1,
  },
  modalOptionSelected: {
    color: Colors.light.primary.main,
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  modalCloseText: {
    ...Typography.body2,
    color: Colors.light.neutral.textSecondary,
  },
});
