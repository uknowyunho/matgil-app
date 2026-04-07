import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Category } from './category.entity';

@Entity('restaurant_categories')
export class RestaurantCategory {
  @PrimaryColumn({ type: 'uuid' })
  restaurantId!: string;

  @PrimaryColumn({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant!: Restaurant;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;
}
