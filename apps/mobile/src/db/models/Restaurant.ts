import { Model } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';

export default class Restaurant extends Model {
  static table = 'restaurants';

  static associations = {
    reviews: { type: 'has_many' as const, foreignKey: 'restaurant_id' },
  };

  @field('server_id') serverId!: string | null;
  @field('name') name!: string;
  @field('address') address!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('phone') phone!: string | null;
  @field('memo') memo!: string | null;
  @field('rating') rating!: number | null;
  @date('last_visited_at') lastVisitedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('reviews') reviews: any;
}
