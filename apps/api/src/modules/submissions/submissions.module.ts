import { Module } from '@nestjs/common';
import { SubmissionController } from '@presentation/controllers/submission.controller';
import { SubmissionUseCase } from './submission.use-case';

@Module({
  controllers: [SubmissionController],
  providers: [SubmissionUseCase],
  exports: [SubmissionUseCase],
})
export class SubmissionsModule {}
