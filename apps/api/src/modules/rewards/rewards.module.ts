import { Module } from '@nestjs/common';
import { RewardController } from '@presentation/controllers/reward.controller';
import { RewardUseCase } from './reward.use-case';
import { AutoPointsListener } from './auto-points.listener';

@Module({
  controllers: [RewardController],
  providers: [RewardUseCase, AutoPointsListener],
  exports: [RewardUseCase],
})
export class RewardsModule {}
