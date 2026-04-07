// Web-compatible network status hook using browser APIs

import { useState, useEffect } from 'react';

interface UseNetworkStatusReturn {
  isConnected: boolean;
  isInternetReachable: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isInternetReachable, setIsInternetReachable] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setIsInternetReachable(true);
    };

    const handleOffline = () => {
      setIsConnected(false);
      setIsInternetReachable(false);
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
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
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isConnected, isInternetReachable };
}
