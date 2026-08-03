import { Module } from '@nestjs/common';
import { ClassController } from '@presentation/controllers/class.controller';
import { ClassUseCase } from './class.use-case';

@Module({
  controllers: [ClassController],
  providers: [ClassUseCase],
  exports: [ClassUseCase],
})
export class ClassesModule {}
