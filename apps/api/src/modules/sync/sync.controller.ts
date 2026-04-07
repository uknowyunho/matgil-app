import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { SyncService, SyncPushPayload } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  @ApiOperation({ summary: 'Pull server changes since last sync timestamp' })
  @ApiQuery({
    name: 'lastPulledAt',
    required: false,
    type: Number,
    description: 'Unix timestamp (ms) of last successful pull',
  })
  async pull(
    @CurrentUser() user: User,
    @Query('lastPulledAt') lastPulledAt?: number,
  ) {
    const changes = await this.syncService.pullChanges(
      user.id,
      lastPulledAt ? new Date(Number(lastPulledAt)) : null,
    );
    return {
      success: true,
      data: {
        changes,
        timestamp: Date.now(),
      },
    };
  }

  @Post('push')
  @ApiOperation({ summary: 'Push local changes to server' })
  async push(
    @CurrentUser() user: User,
    @Body() payload: SyncPushPayload,
  ) {
    const result = await this.syncService.pushChanges(user.id, payload);
    return {
      success: true,
      data: result,
    };
  }
}
