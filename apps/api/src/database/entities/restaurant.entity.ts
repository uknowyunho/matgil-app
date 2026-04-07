import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Review } from './review.entity';
import { Image } from './image.entity';

@Entity('restaurants')
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar' })
  address!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  memo!: string | null;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lastVisitedAt!: Date | null;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews!: Review[];

  @OneToMany(() => Image, (image) => image.restaurant)
  images!: Image[];

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'restaurant_categories',
    joinColumn: { name: 'restaurantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories!: Category[];
}
