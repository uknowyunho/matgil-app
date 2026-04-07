import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateFoodExpenseDto } from './create-food-expense.dto';

export class UpdateFoodExpenseDto extends PartialType(CreateFoodExpenseDto) {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCorporate?: boolean;
}
