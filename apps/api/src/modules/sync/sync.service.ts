import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Category } from '../../database/entities/category.entity';
import { Review } from '../../database/entities/review.entity';
import { Image } from '../../database/entities/image.entity';

interface SyncEntityChanges<T> {
  created: T[];
  updated: T[];
  deleted: string[];
}

interface SyncChanges {
  restaurants: SyncEntityChanges<Restaurant>;
  categories: SyncEntityChanges<Category>;
  reviews: SyncEntityChanges<Review>;
  images: SyncEntityChanges<Image>;
}

interface SyncPushEntity {
  id: string;
  [key: string]: unknown;
}

export interface SyncPushPayload {
  restaurants?: {
    created?: SyncPushEntity[];
    updated?: SyncPushEntity[];
    deleted?: string[];
  };
  categories?: {
    created?: SyncPushEntity[];
    updated?: SyncPushEntity[];
    deleted?: string[];
  };
  reviews?: {
    created?: SyncPushEntity[];
    updated?: SyncPushEntity[];
    deleted?: string[];
  };
  images?: {
    created?: SyncPushEntity[];
    updated?: SyncPushEntity[];
    deleted?: string[];
  };
}

interface SyncPushResult {
  conflicts: Array<{
    entity: string;
    id: string;
    serverVersion: unknown;
  }>;
  applied: {
    restaurants: number;
    categories: number;
    reviews: number;
    images: number;
  };
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  async pullChanges(
    userId: string,
    lastPulledAt: Date | null,
  ): Promise<SyncChanges> {
    this.logger.log(
      `Pull changes for user ${userId} since ${lastPulledAt?.toISOString() || 'beginning'}`,
    );

    const [restaurants, categories, reviews, images] = await Promise.all([
      this.pullRestaurantChanges(userId, lastPulledAt),
      this.pullCategoryChanges(userId, lastPulledAt),
      this.pullReviewChanges(userId, lastPulledAt),
      this.pullImageChanges(userId, lastPulledAt),
    ]);

    return { restaurants, categories, reviews, images };
  }

  async pushChanges(
    userId: string,
    payload: SyncPushPayload,
  ): Promise<SyncPushResult> {
    this.logger.log(`Push changes from user ${userId}`);

    const conflicts: SyncPushResult['conflicts'] = [];
    const applied = {
      restaurants: 0,
      categories: 0,
      reviews: 0,
      images: 0,
    };

    if (payload.restaurants) {
      const result = await this.pushEntityChanges(
        this.restaurantRepository as Repository<any>,
        userId,
        'userId',
        payload.restaurants,
        'restaurants',
      );
      applied.restaurants = result.applied;
      conflicts.push(...result.conflicts);
    }

    if (payload.categories) {
      const result = await this.pushEntityChanges(
        this.categoryRepository as Repository<any>,
        userId,
        'userId',
        payload.categories,
        'categories',
      );
      applied.categories = result.applied;
      conflicts.push(...result.conflicts);
    }

    if (payload.reviews) {
      const result = await this.pushEntityChanges(
        this.reviewRepository as Repository<any>,
        userId,
        'userId',
        payload.reviews,
        'reviews',
      );
      applied.reviews = result.applied;
      conflicts.push(...result.conflicts);
    }

    if (payload.images) {
      const result = await this.pushEntityChanges(
        this.imageRepository as Repository<any>,
        userId,
        'userId',
        payload.images,
        'images',
      );
      applied.images = result.applied;
      conflicts.push(...result.conflicts);
    }

    return { conflicts, applied };
  }

  // --- Per-entity pull methods ---

  private async pullRestaurantChanges(
    userId: string,
    lastPulledAt: Date | null,
  ): Promise<SyncEntityChanges<Restaurant>> {
    const created: Restaurant[] = [];
    const updated: Restaurant[] = [];
    const deleted: string[] = [];

    if (lastPulledAt) {
      const newEntities = await this.restaurantRepository.find({
        where: { userId, createdAt: MoreThan(lastPulledAt) },
      });
      created.push(...newEntities);

      const updatedEntities = await this.restaurantRepository
        .createQueryBuilder('entity')
        .where('entity.userId = :userId', { userId })
        .andWhere('entity.updatedAt > :lastPulledAt', { lastPulledAt })
        .andWhere('entity.createdAt <= :lastPulledAt', { lastPulledAt })
        .getMany();
      updated.push(...updatedEntities);

      const deletedEntities = await this.restaurantRepository
        .createQueryBuilder('entity')
        .withDeleted()
        .select('entity.id')
        .where('entity.userId = :userId', { userId })
        .andWhere('entity.deletedAt IS NOT NULL')
        .andWhere('entity.deletedAt > :lastPulledAt', { lastPulledAt })
        .getMany();
      deleted.push(...deletedEntities.map((e) => e.id));
    } else {
      const allEntities = await this.restaurantRepository.find({
        where: { userId },
      });
      created.push(...allEntities);
    }

    return { created, updated, deleted };
  }

  private async pullCategoryChanges(
    userId: string,
    lastPulledAt: Date | null,
  ): Promise<SyncEntityChanges<Category>> {
    const created: Category[] = [];
    const updated: Category[] = [];
    const deleted: string[] = [];

    if (lastPulledAt) {
      const newEntities = await this.categoryRepository.find({
        where: { userId, createdAt: MoreThan(lastPulledAt) },
      });
      created.push(...newEntities);

      const updatedEntities = await this.categoryRepository
        .createQueryBuilder('entity')
        .where('entity.userId = :userId', { userId })
        .andWhere('entity.updatedAt > :lastPulledAt', { lastPulledAt })
        .andWhere('entity.createdAt <= :lastPulledAt', { lastPulledAt })
        .getMany();
      updated.push(...updatedEntities);
    } else {
      const allEntities = await this.categoryRepository.find({
        where: { userId },
      });
      created.push(...allEntities);
    }

    return { created, updated, deleted };
  }

  private async pullReviewChanges(
    userId: string,
    lastPulledAt: Date | null,
  ): Promise<SyncEntityChanges<Review>> {
    const created: Review[] = [];
    const updated: Review[] = [];
    const deleted: string[] = [];

    if (lastPulledAt) {
      const newEntities = await this.reviewRepository.find({
        where: { userId, createdAt: MoreThan(lastPulledAt) },
      });
      created.push(...newEntities);

      const updatedEntities = await this.reviewRepository
        .createQueryBuilder('entity')
        .where('entity.userId = :userId', { userId })
        .andWhere('entity.updatedAt > :lastPulledAt', { lastPulledAt })
        .andWhere('entity.createdAt <= :lastPulledAt', { lastPulledAt })
        .getMany();
      updated.push(...updatedEntities);
    } else {
      const allEntities = await this.reviewRepository.find({
        where: { userId },
      });
      created.push(...allEntities);
    }

    return { created, updated, deleted };
  }

  private async pullImageChanges(
    userId: string,
    lastPulledAt: Date | null,
  ): Promise<SyncEntityChanges<Image>> {
    const created: Image[] = [];
    const updated: Image[] = [];
    const deleted: string[] = [];

    if (lastPulledAt) {
      const newEntities = await this.imageRepository.find({
        where: { userId, createdAt: MoreThan(lastPulledAt) } as any,
      });
      created.push(...newEntities);
    } else {
      const allEntities = await this.imageRepository.find({
        where: { userId } as any,
      });
      created.push(...allEntities);
    }

    return { created, updated, deleted };
  }

  // --- Generic push method (uses `any` for flexibility across entity types) ---

  private async pushEntityChanges(
    repository: Repository<any>,
    userId: string,
    userIdField: string,
    changes: {
      created?: SyncPushEntity[];
      updated?: SyncPushEntity[];
      deleted?: string[];
    },
    entityName: string,
  ): Promise<{
    applied: number;
    conflicts: SyncPushResult['conflicts'];
  }> {
    let applied = 0;
    const conflicts: SyncPushResult['conflicts'] = [];

    // Process created
    if (changes.created) {
      for (const entity of changes.created) {
        try {
          const newEntity = repository.create({
            ...entity,
            [userIdField]: userId,
          });
          await repository.save(newEntity);
          applied++;
        } catch (error) {
          this.logger.warn(
            `Failed to create ${entityName} ${entity.id}: ${error}`,
          );
        }
      }
    }

    // Process updated (server-wins conflict resolution)
    if (changes.updated) {
      for (const entity of changes.updated) {
        try {
          const existing = await repository.findOne({
            where: { id: entity.id, [userIdField]: userId },
          });

          if (!existing) {
            this.logger.warn(
              `${entityName} ${entity.id} not found for update`,
            );
            continue;
          }

          const serverUpdatedAt = existing.updatedAt as Date;
          const clientUpdatedAt = entity.updatedAt
            ? new Date(entity.updatedAt as string)
            : null;

          if (clientUpdatedAt && serverUpdatedAt > clientUpdatedAt) {
            conflicts.push({
              entity: entityName,
              id: entity.id,
              serverVersion: existing,
            });
            continue;
          }

          Object.assign(existing, entity, { [userIdField]: userId });
          await repository.save(existing);
          applied++;
        } catch (error) {
          this.logger.warn(
            `Failed to update ${entityName} ${entity.id}: ${error}`,
          );
        }
      }
    }

    // Process deleted
    if (changes.deleted) {
      for (const id of changes.deleted) {
        try {
          const existing = await repository.findOne({
            where: { id, [userIdField]: userId },
          });

          if (existing) {
            if (typeof repository.softDelete === 'function') {
              await repository.softDelete(id);
            } else {
              await repository.remove(existing);
            }
            applied++;
          }
        } catch (error) {
          this.logger.warn(
            `Failed to delete ${entityName} ${id}: ${error}`,
          );
        }
      }
    }

    return { applied, conflicts };
  }
}
