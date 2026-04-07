// Web-compatible storage using localStorage (replaces react-native-mmkv)

const KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  ONBOARDING_COMPLETED: 'onboarding.completed',
} as const;

// Generic storage utilities

export function getItem(key: string): string | undefined {
  return localStorage.getItem(key) ?? undefined;
}

export function setItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

// Token-specific utilities

export function getAccessToken(): string | undefined {
  return localStorage.getItem(KEYS.ACCESS_TOKEN) ?? undefined;
}

export function setAccessToken(token: string): void {
  localStorage.setItem(KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | undefined {
  return localStorage.getItem(KEYS.REFRESH_TOKEN) ?? undefined;
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(KEYS.REFRESH_TOKEN, token);
}

export function clearTokens(): void {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
  localStorage.removeItem(KEYS.REFRESH_TOKEN);
}

// Onboarding utilities

export function getOnboardingCompleted(): boolean {
  return localStorage.getItem(KEYS.ONBOARDING_COMPLETED) === 'true';
}

export function setOnboardingCompleted(value: boolean): void {
  localStorage.setItem(KEYS.ONBOARDING_COMPLETED, String(value));
}

export const storage = {
  getString: (key: string) => localStorage.getItem(key) ?? undefined,
  getBoolean: (key: string) => localStorage.getItem(key) === 'true' ? true : undefined,
  set: (key: string, value: string | boolean) => localStorage.setItem(key, String(value)),
  delete: (key: string) => localStorage.removeItem(key),
};
