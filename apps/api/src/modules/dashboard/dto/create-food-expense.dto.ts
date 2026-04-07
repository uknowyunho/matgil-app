import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodExpenseDto {
  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 15000 })
  @IsInt()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: '점심 김치찌개' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;

  @ApiPropertyOptional({ example: 'lunch' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mealType?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCorporate?: boolean;
}
