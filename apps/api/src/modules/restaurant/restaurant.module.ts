import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Category } from '../../database/entities/category.entity';
import { RestaurantCategory } from '../../database/entities/restaurant-category.entity';
import { Image } from '../../database/entities/image.entity';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category, RestaurantCategory, Image]),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
