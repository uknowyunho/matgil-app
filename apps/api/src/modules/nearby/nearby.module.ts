import { Module } from '@nestjs/common';
import { NearbyController } from './nearby.controller';
import { NearbyService } from './nearby.service';

@Module({
  controllers: [NearbyController],
  providers: [NearbyService],
})
export class NearbyModule {}
