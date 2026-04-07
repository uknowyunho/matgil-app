import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(userId: string): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    if (categories.length === 0) {
      return this.initializeDefaultCategories(userId);
    }

    return categories;
  }

  async initializeDefaultCategories(userId: string): Promise<Category[]> {
    const defaultCategories = [
      { name: '한식', colorHex: '#E8663D', sortOrder: 0 },
      { name: '일식', colorHex: '#C93B3B', sortOrder: 1 },
      { name: '중식', colorHex: '#D4952B', sortOrder: 2 },
      { name: '양식', colorHex: '#3B7FC9', sortOrder: 3 },
      { name: '카페', colorHex: '#8B6EC0', sortOrder: 4 },
      { name: '기타', colorHex: '#9C9488', sortOrder: 5 },
    ];

    const savedCategories = await Promise.all(
      defaultCategories.map((cat) =>
        this.categoryRepository.save(
          this.categoryRepository.create({ ...cat, userId }),
        ),
      ),
    );

    this.logger.log(`Default categories initialized for user ${userId}`);
    return savedCategories;
  }

  async create(
    userId: string,
    createDto: CreateCategoryDto,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createDto,
      userId,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async update(
    userId: string,
    id: string,
    updateDto: Partial<CreateCategoryDto>,
  ): Promise<Category> {
    const category = await this.findOneOrFail(userId, id);

    Object.assign(category, updateDto);
    return this.categoryRepository.save(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findOneOrFail(userId, id);

    await this.categoryRepository.remove(category);
    this.logger.log(`Category ${id} deleted by user ${userId}`);
  }

  private async findOneOrFail(
    userId: string,
    id: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('You can only manage your own categories');
    }

    return category;
  }
}
