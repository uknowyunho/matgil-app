import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Max,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiProperty({ example: '스시 오마카세 진' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 123' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 37.5065 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 127.0536 })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '런치 오마카세가 가성비 좋음' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
