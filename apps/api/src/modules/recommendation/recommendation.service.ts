import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';

// Scoring weights from PRD
const WEIGHTS = {
  RATING: 0.3,
  DISTANCE: 0.25,
  FRESHNESS: 0.2,
  DIVERSITY: 0.15,
  RANDOM: 0.1,
};

interface ScoredRestaurant {
  restaurant: Restaurant;
  score: number;
  distanceMeters: number;
  breakdown: {
    rating: number;
    distance: number;
    freshness: number;
    diversity: number;
    random: number;
  };
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async getRecommendations(
    userId: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    excludeCategoryIds?: string[],
  ): Promise<ScoredRestaurant[]> {
    // Fetch user's restaurants within radius using Haversine formula approximation
    const radiusDegrees = radiusMeters / 111320; // rough conversion meters to degrees

    let qb = this.restaurantRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.categories', 'c')
      .leftJoinAndSelect('r.reviews', 'rev')
      .leftJoinAndSelect('r.images', 'img')
      .where('r.userId = :userId', { userId })
      .andWhere('r.deletedAt IS NULL')
      .andWhere('r.latitude BETWEEN :minLat AND :maxLat', {
        minLat: lat - radiusDegrees,
        maxLat: lat + radiusDegrees,
      })
      .andWhere('r.longitude BETWEEN :minLng AND :maxLng', {
        minLng: lng - radiusDegrees,
        maxLng: lng + radiusDegrees,
      });

    // Exclude certain categories
    if (excludeCategoryIds && excludeCategoryIds.length > 0) {
      qb = qb.andWhere('(c.id NOT IN (:...excludeIds) OR c.id IS NULL)', {
        excludeIds: excludeCategoryIds,
      });
    }

    const restaurants = await qb.getMany();

    if (restaurants.length === 0) {
      return [];
    }

    // Calculate scores
    const scored = restaurants.map((restaurant) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        restaurant.latitude,
        restaurant.longitude,
      );

      const ratingScore = this.calculateRatingScore(restaurant.rating);
      const distanceScore = this.calculateDistanceScore(
        distance,
        radiusMeters,
      );
      const freshnessScore = this.calculateFreshnessScore(
        restaurant.lastVisitedAt,
      );
      const diversityScore = this.calculateDiversityScore(restaurant);
      const randomScore = Math.random();

      const totalScore =
        ratingScore * WEIGHTS.RATING +
        distanceScore * WEIGHTS.DISTANCE +
        freshnessScore * WEIGHTS.FRESHNESS +
        diversityScore * WEIGHTS.DIVERSITY +
        randomScore * WEIGHTS.RANDOM;

      return {
        restaurant,
        score: Math.round(totalScore * 1000) / 1000,
        distanceMeters: Math.round(distance),
        breakdown: {
          rating: Math.round(ratingScore * 1000) / 1000,
          distance: Math.round(distanceScore * 1000) / 1000,
          freshness: Math.round(freshnessScore * 1000) / 1000,
          diversity: Math.round(diversityScore * 1000) / 1000,
          random: Math.round(randomScore * 1000) / 1000,
        },
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    this.logger.log(
      `Generated ${scored.length} recommendations for user ${userId}`,
    );

    return scored;
  }

  /**
   * Haversine formula to calculate distance in meters between two lat/lng points
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Rating score: normalized 0-1, higher rating = higher score
   * Restaurants without rating get 0.5 (neutral)
   */
  private calculateRatingScore(rating: number | null): number {
    if (rating === null) return 0.5;
    return (Number(rating) - 1) / 4; // Normalize 1-5 to 0-1
  }

  /**
   * Distance score: closer = higher score (inverse relationship)
   */
  private calculateDistanceScore(
    distanceMeters: number,
    radiusMeters: number,
  ): number {
    if (distanceMeters <= 0) return 1;
    const normalized = 1 - distanceMeters / radiusMeters;
    return Math.max(0, normalized);
  }

  /**
   * Freshness score: restaurants not visited recently get higher scores
   * This encourages revisiting places you haven't been to in a while
   */
  private calculateFreshnessScore(lastVisitedAt: Date | null): number {
    if (!lastVisitedAt) return 0.8; // Never visited = fairly high score

    const daysSinceVisit =
      (Date.now() - new Date(lastVisitedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceVisit > 90) return 1.0; // 3+ months: very fresh
    if (daysSinceVisit > 30) return 0.7; // 1-3 months: moderately fresh
    if (daysSinceVisit > 7) return 0.4; // 1-4 weeks: somewhat recent
    return 0.1; // Within a week: very recent
  }

  /**
   * Diversity score: favors restaurants with fewer reviews (less explored)
   */
  private calculateDiversityScore(restaurant: Restaurant): number {
    const reviewCount = restaurant.reviews?.length || 0;

    if (reviewCount === 0) return 1.0; // Never reviewed: explore!
    if (reviewCount <= 2) return 0.7;
    if (reviewCount <= 5) return 0.4;
    return 0.2; // Well-reviewed
  }
}
