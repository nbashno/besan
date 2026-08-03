import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { EventBus } from '@infrastructure/events/event-bus.service';
import {
  DomainEvent,
  RewardGrantedPayload,
} from '@domain/events/domain-events';
import { PointReason } from '@shared';
import {
  SendCardDto,
  AwardPointsDto,
  RewardCardDto,
} from '@application/dto/reward.dto';

@Injectable()
export class RewardUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

  /** Ø§Ù„Ù…Ø¹Ù„Ù… ÙŠØ±Ø³Ù„ Ø¨Ø·Ø§Ù‚Ø© ØªØ­ÙÙŠØ²ÙŠØ© ÙŠØ¯ÙˆÙŠØ© (Ù‚Ø¯ ØªØ±Ø§ÙÙ‚Ù‡Ø§ Ù†Ù‚Ø§Ø·) */
  async sendCard(
    teacherId: string,
    dto: SendCardDto,
  ): Promise<RewardCardDto> {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Ø§Ù„Ø·Ø§Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯');

    const pointValue = dto.pointValue ?? 0;
    const card = await this.prisma.rewardCard.create({
      data: {
        studentId: dto.studentId,
        teacherId,
        branchId: student.branchId,
        title: dto.title,
        message: dto.message,
        imageUrl: dto.imageUrl,
        pointValue,
      },
    });

    // Ø§Ù„Ù†Ù‚Ø§Ø· Ø§Ù„Ù…Ø±Ø§ÙÙ‚Ø© ØªÙØ³Ø¬ÙŽÙ‘Ù„ ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„Ù†Ù‚Ø§Ø·
    if (pointValue > 0) {
      await this.recordPoints(
        dto.studentId,
        teacherId,
        student.branchId,
        'REWARD_CARD',
        pointValue,
        card.id,
      );
    }

    this.events.publish<RewardGrantedPayload>(DomainEvent.RewardGranted, {
      studentId: dto.studentId,
      teacherId,
      title: dto.title,
      pointValue,
    });

    return this.toCardDto(card);
  }

  /** Ù…Ù†Ø­ Ù†Ù‚Ø§Ø· ÙŠØ¯ÙˆÙŠØ© Ø¨Ù„Ø§ Ø¨Ø·Ø§Ù‚Ø© */
  async awardPoints(
    teacherId: string,
    dto: AwardPointsDto,
  ): Promise<{ total: number }> {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Ø§Ù„Ø·Ø§Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯');
    await this.recordPoints(
      dto.studentId,
      teacherId,
      student.branchId,
      'MANUAL_AWARD',
      dto.value,
    );
    return { total: await this.getTotal(dto.studentId) };
  }

  /** ÙŠÙØ³ØªØ¯Ø¹Ù‰ Ù…Ù† Ù…Ø³ØªÙ…Ø¹ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« Ù„Ù…Ù†Ø­ Ø§Ù„Ù†Ù‚Ø§Ø· ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ */
  async recordPoints(
    studentId: string,
    awardedById: string,
    branchId: string | null,
    reason: PointReason,
    value: number,
    refId?: string,
  ): Promise<void> {
    await this.prisma.pointEntry.create({
      data: { studentId, awardedById, branchId, reason, value, refId },
    });
    this.events.publish(DomainEvent.PointsAwarded, {
      studentId,
      value,
      reason,
    });
  }

  /** Ø±ØµÙŠØ¯ Ø§Ù„Ø·Ø§Ù„Ø¨ = Ù…Ø¬Ù…ÙˆØ¹ Ø³Ø¬Ù„ Ø§Ù„Ù†Ù‚Ø§Ø· (Ø´ÙØ§Ù ÙˆÙ‚Ø§Ø¨Ù„ Ù„Ù„ØªØ±Ø§Ø¬Ø¹) */
  async getTotal(studentId: string): Promise<number> {
    const agg = await this.prisma.pointEntry.aggregate({
      where: { studentId },
      _sum: { value: true },
    });
    return agg._sum.value ?? 0;
  }

  /** Ø¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨ */
  async listCards(studentId: string): Promise<RewardCardDto[]> {
    const cards = await this.prisma.rewardCard.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return cards.map((c: any) => this.toCardDto(c));
  }

  private toCardDto(c: {
    id: string;
    title: string;
    message: string;
    imageUrl: string | null;
    pointValue: number;
    createdAt: Date;
  }): RewardCardDto {
    return {
      id: c.id,
      title: c.title,
      message: c.message,
      imageUrl: c.imageUrl,
      pointValue: c.pointValue,
      createdAt: c.createdAt,
    };
  }
}
