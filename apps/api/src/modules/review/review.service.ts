import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async findByRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<Review[]> {
    // Verify user owns the restaurant
    await this.verifyRestaurantOwnership(userId, restaurantId);

    return this.reviewRepository.find({
      where: { restaurantId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    userId: string,
    restaurantId: string,
    createDto: CreateReviewDto,
  ): Promise<Review> {
    // Verify user owns the restaurant
    await this.verifyRestaurantOwnership(userId, restaurantId);

    const review = this.reviewRepository.create({
      ...createDto,
      userId,
      restaurantId,
    });

    const saved = await this.reviewRepository.save(review);

    // Update restaurant average rating
    await this.updateRestaurantRating(restaurantId);

    this.logger.log(
      `Review created: ${saved.id} for restaurant ${restaurantId}`,
    );
    return saved;
  }

  async update(
    userId: string,
    id: string,
    updateDto: Partial<CreateReviewDto>,
  ): Promise<Review> {
    const review = await this.findOneOrFail(userId, id);

    Object.assign(review, updateDto);
    const updated = await this.reviewRepository.save(review);

    // Update restaurant average rating if rating changed
    if (updateDto.rating !== undefined) {
      await this.updateRestaurantRating(review.restaurantId);
    }

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const review = await this.findOneOrFail(userId, id);
    const { restaurantId } = review;

    await this.reviewRepository.remove(review);

    // Update restaurant average rating
    await this.updateRestaurantRating(restaurantId);

    this.logger.log(`Review ${id} deleted by user ${userId}`);
  }

  private async findOneOrFail(userId: string, id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only manage your own reviews');
    }

    return review;
  }

  private async verifyRestaurantOwnership(
    userId: string,
    restaurantId: string,
  ): Promise<void> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }
  }

  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    const avgRating = result?.avgRating
      ? Math.round(parseFloat(result.avgRating) * 10) / 10
      : null;

    await this.restaurantRepository.update(restaurantId, {
      rating: avgRating,
    });
  }
}
