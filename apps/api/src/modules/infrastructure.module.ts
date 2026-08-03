import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { TelegramAuthVerifier } from '@infrastructure/telegram/telegram-auth.verifier';
import { EventBus } from '@infrastructure/events/event-bus.service';
import { StoragePort } from '@application/ports/storage.port';
import { NotificationPort } from '@application/ports/notification.port';
import { CachePort } from '@application/ports/cache.port';
import { SupabaseStorageAdapter } from '@infrastructure/storage/supabase-storage.adapter';
import { TelegramNotificationAdapter } from '@infrastructure/telegram/telegram-notification.adapter';
import { InMemoryCacheAdapter } from '@infrastructure/cache/in-memory-cache.adapter';

@Global()
@Module({
  providers: [
    PrismaService,
    TelegramAuthVerifier,
    EventBus,
    { provide: StoragePort, useClass: SupabaseStorageAdapter },
    { provide: NotificationPort, useClass: TelegramNotificationAdapter },
    { provide: CachePort, useClass: InMemoryCacheAdapter },
  ],
  exports: [
    PrismaService,
    TelegramAuthVerifier,
    EventBus,
    StoragePort,
    NotificationPort,
    CachePort,
  ],
})
export class InfrastructureModule {}
