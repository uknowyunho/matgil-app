import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  ONBOARDING_COMPLETED: 'onboarding.completed',
} as const;

// Generic storage utilities

export function getItem(key: string): string | undefined {
  return storage.getString(key);
}

export function setItem(key: string, value: string): void {
  storage.set(key, value);
}

export function removeItem(key: string): void {
  storage.delete(key);
}

// Token-specific utilities

export function getAccessToken(): string | undefined {
  return storage.getString(KEYS.ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  storage.set(KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | undefined {
  return storage.getString(KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token: string): void {
  storage.set(KEYS.REFRESH_TOKEN, token);
}

export function clearTokens(): void {
  storage.delete(KEYS.ACCESS_TOKEN);
  storage.delete(KEYS.REFRESH_TOKEN);
}

// Onboarding utilities

export function getOnboardingCompleted(): boolean {
  return storage.getBoolean(KEYS.ONBOARDING_COMPLETED) ?? false;
}

export function setOnboardingCompleted(value: boolean): void {
  storage.set(KEYS.ONBOARDING_COMPLETED, value);
}

export { storage };
