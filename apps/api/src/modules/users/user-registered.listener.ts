import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import {
  DomainEvent,
  UserRegisteredPayload,
} from '@domain/events/domain-events';

// مثال على التصميم المدفوع بالأحداث:
// use-case المصادقة لا يعرف شيئًا عن التدقيق — هذا المستمع منفصل تمامًا
@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(DomainEvent.UserRegistered, { async: true })
  async handle(payload: UserRegisteredPayload): Promise<void> {
    this.logger.log(`مستخدم جديد: ${payload.userId}`);
    await this.prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: payload.userId,
        metadata: { role: payload.role },
      },
    });
  }
}
