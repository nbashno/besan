import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { TelegramAuthVerifier } from '@infrastructure/telegram/telegram-auth.verifier';
import { EventBus } from '@infrastructure/events/event-bus.service';
import { AuthResultDto } from '@application/dto/auth.dto';
import {
  DomainEvent,
  UserRegisteredPayload,
} from '@domain/events/domain-events';

@Injectable()
export class AuthenticateTelegramUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly verifier: TelegramAuthVerifier,
    private readonly events: EventBus,
  ) {}

  async execute(initData: string): Promise<AuthResultDto> {
    const verified = this.verifier.verify(initData);
    if (!verified) {
      throw new UnauthorizedException('تعذّر التحقق من بيانات Telegram');
    }
    const tg = verified;

    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tg.id },
    });

    const user = await this.prisma.user.upsert({
      where: { telegramId: tg.id },
      create: {
        telegramId: tg.id,
        firstName: tg.first_name,
        lastName: tg.last_name,
        username: tg.username,
        photoUrl: tg.photo_url,
        languageCode: tg.language_code,
      },
      update: {
        firstName: tg.first_name,
        lastName: tg.last_name,
        username: tg.username,
        photoUrl: tg.photo_url,
      },
    });

    if (!existing) {
      this.events.publish<UserRegisteredPayload>(DomainEvent.UserRegistered, {
        userId: user.id,
        telegramId: user.telegramId,
        role: user.role,
      });
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      tid: user.telegramId.toString(),
    });

    return {
      accessToken,
      userId: user.id,
      role: user.role,
      firstName: user.displayName ?? user.firstName,
      profileComplete: user.profileComplete,
      displayName: user.displayName,
      schoolName: user.schoolName,
    };
  }
}
