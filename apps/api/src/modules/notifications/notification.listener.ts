import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { NotificationPort } from '@application/ports/notification.port';
import { NotificationUseCase } from './notification.use-case';
import {
  DomainEvent,
  AssignmentCreatedPayload,
  SubmissionCreatedPayload,
  SubmissionGradedPayload,
  RewardGrantedPayload,
} from '@domain/events/domain-events';

/**
 * نقطة الالتقاء للتصميم المدفوع بالأحداث:
 * كل حدث نطاق يُترجَم هنا إلى (إشعار محفوظ + دفع Telegram) بشكل منفصل
 * عن منطق الأعمال الذي أطلقه.
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);
  private readonly webAppUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationUseCase,
    private readonly push: NotificationPort,
    private readonly config: ConfigService,
  ) {
    this.webAppUrl = this.config.get<string>('WEBAPP_URL') ?? '';
  }

  /** واجب جديد منشور → إشعار كل طلاب الصف */
  @OnEvent(DomainEvent.AssignmentCreated)
  async onAssignment(payload: AssignmentCreatedPayload): Promise<void> {
    const members = await this.prisma.classMember.findMany({
      where: { classId: payload.classId, role: 'STUDENT' },
      include: { user: { select: { id: true, telegramId: true } } },
    });
    const title = 'واجب جديد';
    const body = payload.title;
    await Promise.all(
      members.map(async (m: any) => {
        await this.notifications.create({
          userId: m.user.id,
          type: 'NEW_ASSIGNMENT',
          title,
          body,
          data: { assignmentId: payload.assignmentId },
        });
        await this.safePush(m.user.telegramId, title, body, {
          assignmentId: payload.assignmentId,
        });
      }),
    );
  }

  /** تسليم جديد → إشعار المعلم */
  @OnEvent(DomainEvent.SubmissionCreated)
  async onSubmission(payload: SubmissionCreatedPayload): Promise<void> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: payload.teacherId },
      select: { telegramId: true },
    });
    const title = 'تسليم جديد';
    const body = payload.isLate ? 'وصل حل متأخر' : 'وصل حل جديد';
    await this.notifications.create({
      userId: payload.teacherId,
      type: 'SYSTEM',
      title,
      body,
      data: { submissionId: payload.submissionId },
    });
    if (teacher) await this.safePush(teacher.telegramId, title, body);
  }

  /** تصحيح → إشعار الطالب */
  @OnEvent(DomainEvent.SubmissionGraded)
  async onGraded(payload: SubmissionGradedPayload): Promise<void> {
    const student = await this.prisma.user.findUnique({
      where: { id: payload.studentId },
      select: { telegramId: true },
    });
    const title = 'تم تصحيح حلّك';
    const body = `الدرجة: ${payload.value}${
      payload.maxGrade ? ` / ${payload.maxGrade}` : ''
    }`;
    await this.notifications.create({
      userId: payload.studentId,
      type: 'GRADE_PUBLISHED',
      title,
      body,
      data: { submissionId: payload.submissionId },
    });
    if (student) await this.safePush(student.telegramId, title, body);
  }

  /** بطاقة تحفيزية → إشعار الطالب */
  @OnEvent(DomainEvent.RewardGranted)
  async onReward(payload: RewardGrantedPayload): Promise<void> {
    const student = await this.prisma.user.findUnique({
      where: { id: payload.studentId },
      select: { telegramId: true },
    });
    const title = '🏅 بطاقة تحفيزية';
    const body =
      payload.pointValue > 0
        ? `${payload.title} (+${payload.pointValue} نقطة)`
        : payload.title;
    await this.notifications.create({
      userId: payload.studentId,
      type: 'REWARD_CARD',
      title,
      body,
    });
    if (student) await this.safePush(student.telegramId, title, body);
  }

  private async safePush(
    telegramId: bigint,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.push.send({
        telegramId,
        title,
        body,
        deepLink: this.webAppUrl || undefined,
      });
    } catch (err) {
      // الدفع غير حرج — الإشعار محفوظ في القاعدة على أي حال
      this.logger.warn(`فشل دفع Telegram: ${String(err)}`);
    }
  }
}
