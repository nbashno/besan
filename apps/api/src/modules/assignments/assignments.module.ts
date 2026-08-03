import { Module } from '@nestjs/common';
import { AssignmentController } from '@presentation/controllers/assignment.controller';
import { AssignmentUseCase } from './assignment.use-case';

@Module({
  controllers: [AssignmentController],
  providers: [AssignmentUseCase],
  exports: [AssignmentUseCase],
})
export class AssignmentsModule {}
