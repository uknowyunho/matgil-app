import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseNetworkStatusReturn {
  isConnected: boolean;
  isInternetReachable: boolean;
}

/**
 * Custom hook to monitor network connectivity.
 *
 * Note: In a production app, you would use @react-native-community/netinfo.
 * This is a simplified implementation that checks connectivity on app state changes.
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsConnected(true);
        setIsInternetReachable(response.ok || response.status === 204);
      } catch {
        setIsConnected(false);
        setIsInternetReachable(false);
      }
    };

    // Check on mount
    checkConnectivity();

    // Re-check when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnectivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return { isConnected, isInternetReachable };
}
