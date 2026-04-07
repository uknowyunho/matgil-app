import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '점심 특선이 정말 맛있었습니다. 스시가 신선해요.' })
  @IsString()
  @MaxLength(1000, { message: 'Review content must be at most 1000 characters' })
  content!: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  visitedDate?: string;
}
