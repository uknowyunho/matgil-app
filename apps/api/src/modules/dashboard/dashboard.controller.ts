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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { CreateFoodExpenseDto } from './dto/create-food-expense.dto';
import { UpdateFoodExpenseDto } from './dto/update-food-expense.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics for a given month' })
  async getStats(
    @CurrentUser() user: User,
    @Query() query: DashboardQueryDto,
  ) {
    const stats = await this.dashboardService.getStats(
      user.id,
      query.year,
      query.month,
    );
    return { success: true, data: stats };
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create a food expense entry' })
  async createExpense(
    @CurrentUser() user: User,
    @Body() dto: CreateFoodExpenseDto,
  ) {
    const expense = await this.dashboardService.createExpense(user.id, dto);
    return { success: true, data: expense };
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update a food expense entry' })
  async updateExpense(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodExpenseDto,
  ) {
    const expense = await this.dashboardService.updateExpense(
      user.id,
      id,
      dto,
    );
    return { success: true, data: expense };
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get all food expenses for a given month' })
  async getMonthlyExpenses(
    @CurrentUser() user: User,
    @Query() query: DashboardQueryDto,
  ) {
    const expenses = await this.dashboardService.getMonthlyExpenses(
      user.id,
      query.year,
      query.month,
    );
    return { success: true, data: expenses };
  }

  @Get('restaurants/:restaurantId/expenses')
  @ApiOperation({ summary: 'Get food expenses for a specific restaurant' })
  async getExpensesByRestaurant(
    @CurrentUser() user: User,
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    const expenses = await this.dashboardService.getExpensesByRestaurant(
      user.id,
      restaurantId,
    );
    return { success: true, data: expenses };
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete a food expense entry' })
  async removeExpense(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.dashboardService.removeExpense(user.id, id);
    return { success: true, data: { message: 'Food expense deleted' } };
  }
}
