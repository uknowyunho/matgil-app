import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { database } from '../db/database';
import { syncDatabase } from '../db/sync';
import { useNetworkStatus } from './useNetworkStatus';

export function useSync() {
  const { isConnected } = useNetworkStatus();
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    if (isSyncing.current || !isConnected) return;
    isSyncing.current = true;
    try {
      await syncDatabase(database);
    } catch {
      // silently fail - sync will retry on next trigger
    } finally {
      isSyncing.current = false;
    }
  }, [isConnected]);

  // Sync on mount
  useEffect(() => {
    sync();
  }, [sync]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        sync();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [sync]);

  // Sync when network reconnects
  useEffect(() => {
    if (isConnected) {
      sync();
    }
  }, [isConnected, sync]);

  return { sync, isConnected };
}
