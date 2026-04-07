import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  @field('server_id') serverId!: string | null;
  @field('name') name!: string;
  @field('color_hex') colorHex!: string;
  @field('sort_order') sortOrder!: number;
}
