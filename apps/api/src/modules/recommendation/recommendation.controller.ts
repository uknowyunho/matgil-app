import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { RecommendationService } from './recommendation.service';

class RecommendationRequestDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsNumber()
  @Min(100)
  @Max(50000)
  radius!: number; // meters

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeCategoryIds?: string[];
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Get restaurant recommendations based on location' })
  async getRecommendations(
    @CurrentUser() user: User,
    @Body() dto: RecommendationRequestDto,
  ) {
    const recommendations = await this.recommendationService.getRecommendations(
      user.id,
      dto.lat,
      dto.lng,
      dto.radius,
      dto.excludeCategoryIds,
    );
    return { success: true, data: recommendations };
  }
}
