import { Module } from '@nestjs/common';
import { AnalyticsController } from '@presentation/controllers/analytics.controller';
import { AnalyticsUseCase } from './analytics.use-case';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsUseCase],
  exports: [AnalyticsUseCase],
})
export class AnalyticsModule {}
