import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';

import type { MainTabParamList, HomeStackParamList, ProfileStackParamList, RecommendStackParamList } from '../types';
import { Colors } from '../theme/colors';

// Home stack screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/home/SearchScreen';
import { RestaurantDetailScreen } from '../screens/restaurant/RestaurantDetailScreen';
import { RestaurantAddScreen } from '../screens/restaurant/RestaurantAddScreen';
import { RestaurantEditScreen } from '../screens/restaurant/RestaurantEditScreen';

// Recommend screen
import { RecommendScreen } from '../screens/recommend/RecommendScreen';


// Profile stack screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CategoryManageScreen } from '../screens/profile/CategoryManageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RecommendStack = createNativeStackNavigator<RecommendStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.neutral.bg },
        headerTintColor: Colors.light.neutral.textTitle,
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: '검색' }}
      />
      <HomeStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: '' }}
      />
      <HomeStack.Screen
        name="RestaurantAdd"
        component={RestaurantAddScreen}
        options={{ title: '맛집 추가' }}
      />
      <HomeStack.Screen
        name="RestaurantEdit"
        component={RestaurantEditScreen}
        options={{ title: '맛집 수정' }}
      />
    </HomeStack.Navigator>
  );
}

function RecommendStackNavigator() {
  return (
    <RecommendStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.neutral.bg },
        headerTintColor: Colors.light.neutral.textTitle,
        headerShadowVisible: false,
      }}
    >
      <RecommendStack.Screen
        name="RecommendMain"
        component={RecommendScreen}
        options={{ headerShown: false }}
      />
      <RecommendStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: '' }}
      />
      <RecommendStack.Screen
        name="RestaurantAdd"
        component={RestaurantAddScreen}
        options={{ title: '맛집 추가' }}
      />
      <RecommendStack.Screen
        name="RestaurantEdit"
        component={RestaurantEditScreen}
        options={{ title: '맛집 수정' }}
      />
    </RecommendStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.neutral.bg },
        headerTintColor: Colors.light.neutral.textTitle,
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="CategoryManage"
        component={CategoryManageScreen}
        options={{ title: '카테고리 관리' }}
      />
    </ProfileStack.Navigator>
  );
}

// Simple icon components using Text emoji/unicode as placeholders
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    Home: '\u2302',       // House
    Recommend: '\u2728',  // Sparkle
    Profile: '\u263A',    // Smiley (User)
  };
  return <Text style={[styles.tabIcon, { color }]}>{icons[name] ?? '?'}</Text>;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary.main,
        tabBarInactiveTintColor: Colors.light.neutral.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.neutral.bg,
          borderTopColor: Colors.light.neutral.border,
        },
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="Recommend"
        component={RecommendStackNavigator}
        options={{ tabBarLabel: 'MY' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: '프로필' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 22,
  },
});
