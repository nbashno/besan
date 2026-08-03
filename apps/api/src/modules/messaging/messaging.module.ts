import { Module } from '@nestjs/common';
import { MessageController } from '@presentation/controllers/message.controller';
import { MessageUseCase } from './message.use-case';

@Module({
  controllers: [MessageController],
  providers: [MessageUseCase],
  exports: [MessageUseCase],
})
export class MessagingModule {}
