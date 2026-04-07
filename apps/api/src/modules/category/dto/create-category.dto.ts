import { IsString, MaxLength, Matches, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: '일식' })
  @IsString()
  @MaxLength(50, { message: 'Category name must be at most 50 characters' })
  name!: string;

  @ApiProperty({ example: '#FF6B6B' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #FF6B6B)',
  })
  colorHex!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
