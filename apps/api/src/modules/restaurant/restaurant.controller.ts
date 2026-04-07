import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@ApiTags('Restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant' })
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreateRestaurantDto,
  ) {
    const restaurant = await this.restaurantService.create(user.id, createDto);
    return { success: true, data: restaurant };
  }

  @Get()
  @ApiOperation({ summary: 'List restaurants with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['name', 'rating', 'createdAt', 'lastVisitedAt'],
  })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    const result = await this.restaurantService.findAll(user.id, {
      page,
      limit,
      search,
      categoryId,
      sort,
      order,
    });
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const restaurant = await this.restaurantService.findOne(user.id, id);
    return { success: true, data: restaurant };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a restaurant' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRestaurantDto,
  ) {
    const restaurant = await this.restaurantService.update(
      user.id,
      id,
      updateDto,
    );
    return { success: true, data: restaurant };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a restaurant' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.restaurantService.remove(user.id, id);
    return { success: true, data: { message: 'Restaurant deleted' } };
  }
}
