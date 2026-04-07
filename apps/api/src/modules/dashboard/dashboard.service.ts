import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { FoodExpense } from '../../database/entities/food-expense.entity';
import { CreateFoodExpenseDto } from './dto/create-food-expense.dto';
import { UpdateFoodExpenseDto } from './dto/update-food-expense.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(FoodExpense)
    private readonly foodExpenseRepository: Repository<FoodExpense>,
  ) {}

  async getStats(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Total restaurant count
    const totalRestaurantCount = await this.restaurantRepository.count({
      where: { userId },
    });

    // Top 3 visited restaurants (by review count)
    const topVisited = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.restaurantId', 'restaurantId')
      .addSelect('restaurant.name', 'name')
      .addSelect('restaurant.rating', 'rating')
      .addSelect('COUNT(*)', 'visitCount')
      .innerJoin('review.restaurant', 'restaurant')
      .where('review.userId = :userId', { userId })
      .groupBy('review.restaurantId')
      .addGroupBy('restaurant.name')
      .addGroupBy('restaurant.rating')
      .orderBy('"visitCount"', 'DESC')
      .limit(3)
      .getRawMany();

    const topVisitedRestaurants = topVisited.map((row) => ({
      restaurantId: row.restaurantId,
      name: row.name,
      visitCount: parseInt(row.visitCount, 10),
      rating: row.rating ? parseFloat(row.rating) : null,
    }));

    // Daily expenses from food_expenses table for this month
    const foodExpenses = await this.foodExpenseRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
    });

    // Review amounts for this month
    const reviewAmounts = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.visitedDate', 'date')
      .addSelect('SUM(review.amount)', 'total')
      .where('review.userId = :userId', { userId })
      .andWhere('review.amount IS NOT NULL')
      .andWhere('review.visitedDate >= :startStr', { startStr })
      .andWhere('review.visitedDate <= :endStr', { endStr })
      .groupBy('review.visitedDate')
      .getRawMany();

    // Merge into daily expenses map
    const dailyMap = new Map<string, number>();
    const mealTypeMap = new Map<string, Set<string>>();

    for (const expense of foodExpenses) {
      const dateKey =
        typeof expense.date === 'string'
          ? expense.date
          : (expense.date as Date).toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + expense.amount);
      if (expense.mealType) {
        const set = mealTypeMap.get(dateKey) ?? new Set<string>();
        set.add(expense.mealType);
        mealTypeMap.set(dateKey, set);
      }
    }

    for (const row of reviewAmounts) {
      const dateKey =
        typeof row.date === 'string'
          ? row.date
          : (row.date as Date).toISOString().split('T')[0];
      const total = parseInt(row.total, 10);
      dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + total);
    }

    const dailyExpenses = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
        ...(mealTypeMap.has(date)
          ? { mealTypes: Array.from(mealTypeMap.get(date)!) }
          : {}),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthlyExpenseTotal = dailyExpenses.reduce(
      (sum, d) => sum + d.amount,
      0,
    );

    const daysInMonth = endDate.getDate();
    const dailyAverage =
      daysInMonth > 0 ? Math.round(monthlyExpenseTotal / daysInMonth) : 0;

    return {
      totalRestaurantCount,
      topVisitedRestaurants,
      monthlyExpenseTotal,
      dailyAverage,
      dailyExpenses,
    };
  }

  async createExpense(
    userId: string,
    dto: CreateFoodExpenseDto,
  ): Promise<FoodExpense> {
    const expense = this.foodExpenseRepository.create({
      ...dto,
      userId,
    });
    const saved = await this.foodExpenseRepository.save(expense);
    this.logger.log(`Food expense created: ${saved.id}`);
    return saved;
  }

  async updateExpense(
    userId: string,
    id: string,
    dto: UpdateFoodExpenseDto,
  ): Promise<FoodExpense> {
    const expense = await this.findExpenseOrFail(userId, id);
    Object.assign(expense, dto);
    return this.foodExpenseRepository.save(expense);
  }

  async removeExpense(userId: string, id: string): Promise<void> {
    const expense = await this.findExpenseOrFail(userId, id);
    await this.foodExpenseRepository.remove(expense);
    this.logger.log(`Food expense ${id} deleted by user ${userId}`);
  }

  async getMonthlyExpenses(
    userId: string,
    year: number,
    month: number,
  ): Promise<FoodExpense[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.foodExpenseRepository.find({
      where: { userId, date: Between(startDate, endDate) },
      order: { date: 'ASC', createdAt: 'ASC' },
    });
  }

  async getExpensesByRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<FoodExpense[]> {
    return this.foodExpenseRepository.find({
      where: { userId, restaurantId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  private async findExpenseOrFail(
    userId: string,
    id: string,
  ): Promise<FoodExpense> {
    const expense = await this.foodExpenseRepository.findOne({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`Food expense with ID ${id} not found`);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenException('You can only manage your own expenses');
    }

    return expense;
  }
}
