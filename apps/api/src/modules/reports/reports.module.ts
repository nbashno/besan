import { Module } from '@nestjs/common';
import { ReportUseCase } from './report.use-case';
import { ReportDispatchUseCase } from './report-dispatch.use-case';
import { ReportController } from '@presentation/controllers/report.controller';

@Module({
  controllers: [ReportController],
  providers: [ReportUseCase, ReportDispatchUseCase],
})
export class ReportsModule {}
