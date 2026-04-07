import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: "List user's categories" })
  async findAll(@CurrentUser() user: User) {
    const categories = await this.categoryService.findAll(user.id);
    return { success: true, data: categories };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreateCategoryDto,
  ) {
    const category = await this.categoryService.create(user.id, createDto);
    return { success: true, data: category };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateCategoryDto>,
  ) {
    const category = await this.categoryService.update(user.id, id, updateDto);
    return { success: true, data: category };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoryService.remove(user.id, id);
    return { success: true, data: { message: 'Category deleted' } };
  }
}
