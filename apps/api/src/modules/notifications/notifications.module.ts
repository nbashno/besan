import { Module } from '@nestjs/common';
import { NotificationController } from '@presentation/controllers/notification.controller';
import { NotificationUseCase } from './notification.use-case';
import { NotificationListener } from './notification.listener';

@Module({
  controllers: [NotificationController],
  providers: [NotificationUseCase, NotificationListener],
  exports: [NotificationUseCase],
})
export class NotificationsModule {}
