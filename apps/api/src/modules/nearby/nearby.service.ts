import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoPlace[];
}

export interface NearbyRestaurantResult {
  kakaoId: string;
  name: string;
  categoryName: string;
  phone: string;
  address: string;
  roadAddress: string;
  longitude: number;
  latitude: number;
  placeUrl: string;
  distance: number;
}

export interface NearbySearchResult {
  restaurants: NearbyRestaurantResult[];
  meta: {
    totalCount: number;
    isEnd: boolean;
    currentPage: number;
  };
}

export interface NearbyBucketResult {
  label: string;
  restaurants: NearbyRestaurantResult[];
}

export interface NearbyGroupedResult {
  buckets: NearbyBucketResult[];
}

@Injectable()
export class NearbyService {
  private readonly logger = new Logger(NearbyService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('kakao.restApiKey') || '';
  }

  // ─── 기존 단일 검색 ──────────────────────────────────────────
  async searchNearby(
    lat: number,
    lng: number,
    radius: number,
    page = 1,
  ): Promise<NearbySearchResult> {
    const docs = await this.callKakao(lat, lng, radius, page);
    return {
      restaurants: docs.documents.map((doc) => this.transformDoc(doc)),
      meta: {
        totalCount: docs.meta.total_count,
        isEnd: docs.meta.is_end,
        currentPage: page,
      },
    };
  }

  // ─── 그룹 검색 (500m / 1km / 3km) ──────────────────────────
  async searchGrouped(userLat: number, userLng: number): Promise<NearbyGroupedResult> {
    // API 키가 없으면 더미 데이터 반환
    if (!this.apiKey || this.apiKey.includes('YOUR_KAKAO')) {
      return this.getDummyGroupedData(userLat, userLng);
    }

    const cosLat = Math.cos(userLat * (Math.PI / 180));

    // 1km 오프셋: 750m, 반경 500m
    const off1 = 750 / 111320;
    const lngOff1 = off1 / cosLat;

    // 3km 오프셋: 2000m, 반경 1500m
    const off3 = 2000 / 111320;
    const lngOff3 = off3 / cosLat;

    // 병렬: 500m 직접(최대한 많이) + 1km 4방향 + 3km 4방향 = 9 호출
    const [
      direct500,
      n1, s1, e1, w1,
      n3, s3, e3, w3,
    ] = await Promise.all([
      this.fetchPages(userLat, userLng, 500, 15), // 500m는 최대 15페이지까지 탐색하여 누락 방지
      // 1km 오프셋
      this.fetchPages(userLat + off1, userLng, 500, 2),
      this.fetchPages(userLat - off1, userLng, 500, 2),
      this.fetchPages(userLat, userLng + lngOff1, 500, 2),
      this.fetchPages(userLat, userLng - lngOff1, 500, 2),
      // 3km 오프셋
      this.fetchPages(userLat + off3, userLng, 1500, 2),
      this.fetchPages(userLat - off3, userLng, 1500, 2),
      this.fetchPages(userLat, userLng + lngOff3, 1500, 2),
      this.fetchPages(userLat, userLng - lngOff3, 1500, 2),
    ]);

    const seen = new Set<string>();
    const bucket500: NearbyRestaurantResult[] = [];
    const bucket1km: NearbyRestaurantResult[] = [];
    const bucket3km: NearbyRestaurantResult[] = [];

    // 500m 버킷
    for (const doc of direct500) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const dist = this.haversine(userLat, userLng, parseFloat(doc.y), parseFloat(doc.x));
      if (dist <= 500) {
        bucket500.push({ ...this.transformDoc(doc), distance: dist });
      }
    }

    // 1km 버킷
    for (const docs of [n1, s1, e1, w1]) {
      for (const doc of docs) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const dist = this.haversine(userLat, userLng, parseFloat(doc.y), parseFloat(doc.x));
        if (dist > 500 && dist <= 1000) {
          bucket1km.push({ ...this.transformDoc(doc), distance: dist });
        }
      }
    }

    // 3km 버킷
    for (const docs of [n3, s3, e3, w3]) {
      for (const doc of docs) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const dist = this.haversine(userLat, userLng, parseFloat(doc.y), parseFloat(doc.x));
        if (dist > 1000 && dist <= 3000) {
          bucket3km.push({ ...this.transformDoc(doc), distance: dist });
        }
      }
    }

    bucket500.sort((a, b) => a.distance - b.distance);
    bucket1km.sort((a, b) => a.distance - b.distance);
    bucket3km.sort((a, b) => a.distance - b.distance);

    return {
      buckets: [
        { label: '500m', restaurants: bucket500 },
        { label: '1km', restaurants: bucket1km },
        { label: '3km', restaurants: bucket3km },
      ],
    };
  }

  // ─── 키워드 검색 ───────────────────────────────────────────
  async searchKeyword(
    query: string,
    lat?: number,
    lng?: number,
  ): Promise<NearbyRestaurantResult[]> {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', query);
    url.searchParams.set('category_group_code', 'FD6');
    url.searchParams.set('size', '10');

    if (lat != null && lng != null) {
      url.searchParams.set('y', String(lat));
      url.searchParams.set('x', String(lng));
      url.searchParams.set('sort', 'distance');
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      this.logger.error(`Kakao keyword search error: ${response.status}`);
      throw new Error(`Kakao API request failed with status ${response.status}`);
    }

    const data: KakaoSearchResponse = await response.json();
    return data.documents.map((doc) => this.transformDoc(doc));
  }

  // ─── Kakao API 호출 ─────────────────────────────────────────
  private async callKakao(
    lat: number,
    lng: number,
    radius: number,
    page: number,
  ): Promise<KakaoSearchResponse> {
    const url = new URL('https://dapi.kakao.com/v2/local/search/category.json');
    url.searchParams.set('category_group_code', 'FD6');
    url.searchParams.set('x', String(lng));
    url.searchParams.set('y', String(lat));
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', '15');
    url.searchParams.set('sort', 'distance');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
    });

    if (!response.ok) {
      this.logger.error(`Kakao API error: ${response.status}`);
      throw new Error(`Kakao API request failed with status ${response.status}`);
    }

    return response.json();
  }

  private async fetchPages(
    lat: number,
    lng: number,
    radius: number,
    maxPages: number,
  ): Promise<KakaoPlace[]> {
    const all: KakaoPlace[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await this.callKakao(lat, lng, radius, page);
      all.push(...data.documents);
      if (data.meta.is_end) break;
    }
    return all;
  }

  private transformDoc(doc: KakaoPlace): NearbyRestaurantResult {
    return {
      kakaoId: doc.id,
      name: doc.place_name,
      categoryName: doc.category_name,
      phone: doc.phone,
      address: doc.address_name,
      roadAddress: doc.road_address_name,
      longitude: parseFloat(doc.x),
      latitude: parseFloat(doc.y),
      placeUrl: doc.place_url,
      distance: parseInt(doc.distance, 10),
    };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  private getDummyGroupedData(lat: number, lng: number): NearbyGroupedResult {
    const categories = ['한식', '일식', '중식', '양식', '카페'];
    const generateDummy = (label: string, count: number, maxDist: number) => {
      return Array.from({ length: count }).map((_, i) => ({
        kakaoId: `dummy-\${label}-\${i}`,
        name: `\${label} 맛집 \${i + 1}호점`,
        categoryName: `음식점 > \${categories[i % categories.length]}`,
        phone: '02-1234-5678',
        address: '서울시 강남구 역삼동 123-45',
        roadAddress: '서울시 강남구 테헤란로 123',
        longitude: lng + (Math.random() - 0.5) * 0.01,
        latitude: lat + (Math.random() - 0.5) * 0.01,
        placeUrl: 'https://place.map.kakao.com/12345',
        distance: Math.floor(Math.random() * maxDist),
      }));
    };

    return {
      buckets: [
        { label: '500m', restaurants: generateDummy('500m', 3, 500).sort((a, b) => a.distance - b.distance) },
        { label: '1km', restaurants: generateDummy('1km', 5, 1000).sort((a, b) => a.distance - b.distance) },
        { label: '3km', restaurants: generateDummy('3km', 8, 3000).sort((a, b) => a.distance - b.distance) },
      ],
    };
  }
}
