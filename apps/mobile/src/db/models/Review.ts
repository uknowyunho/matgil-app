import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class Review extends Model {
  static table = 'reviews';

  static associations = {
    restaurants: { type: 'belongs_to' as const, key: 'restaurant_id' },
  };

  @field('server_id') serverId!: string | null;
  @field('restaurant_id') restaurantId!: string;
  @field('content') content!: string;
  @field('rating') rating!: number;
  @date('visited_date') visitedDate!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('restaurants', 'restaurant_id') restaurant: any;
}
