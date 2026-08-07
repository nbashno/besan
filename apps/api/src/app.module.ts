import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { InfrastructureModule } from '@/modules/infrastructure.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { HealthModule } from '@/modules/health/health.module';
import { ClassesModule } from '@/modules/classes/classes.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { AssignmentsModule } from '@/modules/assignments/assignments.module';
import { SubmissionsModule } from '@/modules/submissions/submissions.module';
import { RewardsModule } from '@/modules/rewards/rewards.module';
import { MessagingModule } from '@/modules/messaging/messaging.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    // JWT عام حتى يستطيع JwtAuthGuard التحقق على كل المسارات
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('JWT_ACCESS_TTL') ?? 900),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('RATE_LIMIT_TTL') ?? 60) * 1000,
          limit: Number(config.get('RATE_LIMIT_MAX') ?? 100),
        },
      ],
    }),
    InfrastructureModule,
    AuthModule,
    UsersModule,
    HealthModule,
    ClassesModule,
    ReportsModule,
    AssignmentsModule,
    SubmissionsModule,
    RewardsModule,
    MessagingModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
