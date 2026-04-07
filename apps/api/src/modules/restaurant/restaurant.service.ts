import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Category } from '../../database/entities/category.entity';
import { RestaurantCategory } from '../../database/entities/restaurant-category.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

interface PaginatedResult {
  items: Restaurant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(RestaurantCategory)
    private readonly restaurantCategoryRepository: Repository<RestaurantCategory>,
  ) {}

  async create(
    userId: string,
    createDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const { categoryIds, ...restaurantData } = createDto;

    // Create restaurant
    const restaurant = this.restaurantRepository.create({
      ...restaurantData,
      userId,
    });

    const savedRestaurant = await this.restaurantRepository.save(restaurant);

    // Assign categories if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(categoryIds), userId },
      });

      const restaurantCategories = categories.map((category) =>
        this.restaurantCategoryRepository.create({
          restaurantId: savedRestaurant.id,
          categoryId: category.id,
        }),
      );

      await this.restaurantCategoryRepository.save(restaurantCategories);
    }

    return this.findOne(userId, savedRestaurant.id);
  }

  async findAll(
    userId: string,
    options: FindAllOptions,
  ): Promise<PaginatedResult> {
    const { page, limit, search, categoryId, sort, order } = options;

    const qb: SelectQueryBuilder<Restaurant> = this.restaurantRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.categories', 'category')
      .leftJoinAndSelect('restaurant.images', 'image')
      .where('restaurant.userId = :userId', { userId });

    // Search filter
    if (search) {
      qb.andWhere(
        '(restaurant.name ILIKE :search OR restaurant.address ILIKE :search OR restaurant.memo ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Category filter
    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    // Sorting
    const sortField = sort || 'createdAt';
    const sortOrder = order || 'DESC';
    const allowedSortFields = ['name', 'rating', 'createdAt', 'lastVisitedAt'];

    if (allowedSortFields.includes(sortField)) {
      qb.orderBy(`restaurant.${sortField}`, sortOrder);
    } else {
      qb.orderBy('restaurant.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id, userId },
      relations: ['categories', 'reviews', 'images'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(userId, id);

    if (restaurant.userId !== userId) {
      throw new ForbiddenException('You can only update your own restaurants');
    }

    const { categoryIds, ...updateData } = updateDto;

    // Update restaurant fields
    Object.assign(restaurant, updateData);
    await this.restaurantRepository.save(restaurant);

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Remove existing categories
      await this.restaurantCategoryRepository.delete({
        restaurantId: id,
      });

      // Add new categories
      if (categoryIds.length > 0) {
        const categories = await this.categoryRepository.find({
          where: { id: In(categoryIds), userId },
        });

        const restaurantCategories = categories.map((category) =>
          this.restaurantCategoryRepository.create({
            restaurantId: id,
            categoryId: category.id,
          }),
        );

        await this.restaurantCategoryRepository.save(restaurantCategories);
      }
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const restaurant = await this.findOne(userId, id);

    if (restaurant.userId !== userId) {
      throw new ForbiddenException('You can only delete your own restaurants');
    }

    // Soft delete
    await this.restaurantRepository.softDelete(id);
    this.logger.log(`Restaurant ${id} soft-deleted by user ${userId}`);
  }
}
