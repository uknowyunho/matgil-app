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
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('restaurants/:restaurantId/reviews')
  @ApiOperation({ summary: 'List reviews for a restaurant' })
  async findByRestaurant(
    @CurrentUser() user: User,
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    const reviews = await this.reviewService.findByRestaurant(
      user.id,
      restaurantId,
    );
    return { success: true, data: reviews };
  }

  @Post('restaurants/:restaurantId/reviews')
  @ApiOperation({ summary: 'Create a review for a restaurant' })
  async create(
    @CurrentUser() user: User,
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() createDto: CreateReviewDto,
  ) {
    const review = await this.reviewService.create(
      user.id,
      restaurantId,
      createDto,
    );
    return { success: true, data: review };
  }

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateReviewDto>,
  ) {
    const review = await this.reviewService.update(user.id, id, updateDto);
    return { success: true, data: review };
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.reviewService.remove(user.id, id);
    return { success: true, data: { message: 'Review deleted' } };
  }
}
