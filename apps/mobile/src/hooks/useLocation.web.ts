// Web-compatible location hook using Browser Geolocation API

import { useState, useEffect, useCallback } from 'react';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

// 서울시청 기본 좌표 (위치 권한 불가 시 폴백)
const DEFAULT_LOCATION: LocationCoords = {
  latitude: 37.5665,
  longitude: 126.978,
};

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const useFallback = useCallback(() => {
    setLocation(DEFAULT_LOCATION);
    setError('위치를 가져올 수 없어 기본 위치(서울)를 사용합니다.');
    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      useFallback();
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      () => {
        useFallback();
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, [useFallback]);

  // 초기 마운트 시 자동으로 위치 요청
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { location, error, isLoading, requestPermission };
}
