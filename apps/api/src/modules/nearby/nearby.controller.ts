import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NearbyService } from './nearby.service';
import { NearbySearchDto } from './dto/nearby-search.dto';

class KeywordSearchDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

class NearbyGroupedDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

@ApiTags('Nearby')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nearby')
export class NearbyController {
  constructor(private readonly nearbyService: NearbyService) {}

  @Get('search/keyword')
  @ApiOperation({ summary: 'Search restaurants by keyword via Kakao' })
  async searchKeyword(@Query() dto: KeywordSearchDto) {
    const result = await this.nearbyService.searchKeyword(
      dto.query,
      dto.lat,
      dto.lng,
    );
    return { success: true, data: result };
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Search nearby restaurants via Kakao Local API' })
  async searchNearby(@Query() dto: NearbySearchDto) {
    const result = await this.nearbyService.searchNearby(
      dto.lat,
      dto.lng,
      dto.radius,
      dto.page,
    );
    return { success: true, data: result };
  }

  @Get('restaurants/grouped')
  @ApiOperation({ summary: 'Search nearby restaurants grouped by distance (500m / 1km)' })
  async searchGrouped(@Query() dto: NearbyGroupedDto) {
    const result = await this.nearbyService.searchGrouped(dto.lat, dto.lng);
    return { success: true, data: result };
  }
}
