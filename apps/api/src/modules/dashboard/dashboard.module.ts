import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Review } from '../../database/entities/review.entity';
import { FoodExpense } from '../../database/entities/food-expense.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Review, FoodExpense])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
