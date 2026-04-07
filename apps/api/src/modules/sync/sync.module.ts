import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../../database/entities/restaurant.entity';
import { Category } from '../../database/entities/category.entity';
import { Review } from '../../database/entities/review.entity';
import { Image } from '../../database/entities/image.entity';
import { RestaurantCategory } from '../../database/entities/restaurant-category.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Category,
      Review,
      Image,
      RestaurantCategory,
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
