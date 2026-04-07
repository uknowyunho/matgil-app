import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

@Entity('food_expenses')
export class FoodExpense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  restaurantId!: string | null;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  memo!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mealType!: string | null;

  @Column({ type: 'boolean', default: false })
  isCorporate!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Restaurant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'restaurantId' })
  restaurant!: Restaurant | null;
}
