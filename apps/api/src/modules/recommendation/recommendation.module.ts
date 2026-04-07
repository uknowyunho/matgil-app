import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Category } from '../../database/entities/category.entity';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
