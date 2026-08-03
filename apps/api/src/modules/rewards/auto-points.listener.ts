import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { RewardUseCase } from './reward.use-case';
import {
  DomainEvent,
  SubmissionCreatedPayload,
  SubmissionGradedPayload,
} from '@domain/events/domain-events';

/**
 * منطق النقاط التلقائية معزول تمامًا عن منطق التسليم.
 * منتِج الحدث (SubmissionUseCase) لا يعرف بوجود هذا المستمع.
 * القواعد (قيم النقاط، عتبة الدرجة العالية) قابلة للتوسيع دون لمس منطق آخر.
 */
@Injectable()
export class AutoPointsListener {
  // قيم افتراضية — يمكن نقلها للإعدادات لاحقًا
  private readonly POINTS_ON_TIME = 10;
  private readonly POINTS_HIGH_GRADE = 15;
  private readonly HIGH_GRADE_RATIO = 0.9; // 90% فأكثر

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardUseCase,
  ) {}

  @OnEvent(DomainEvent.SubmissionCreated)
  async onSubmission(payload: SubmissionCreatedPayload): Promise<void> {
    if (payload.isLate) return; // نقاط للتسليم في الموعد فقط
    const student = await this.prisma.user.findUnique({
      where: { id: payload.studentId },
      select: { branchId: true },
    });
    await this.rewards.recordPoints(
      payload.studentId,
      payload.teacherId,
      student?.branchId ?? null,
      'SUBMISSION_ON_TIME',
      this.POINTS_ON_TIME,
      payload.submissionId,
    );
  }

  @OnEvent(DomainEvent.SubmissionGraded)
  async onGraded(payload: SubmissionGradedPayload): Promise<void> {
    if (payload.maxGrade == null || payload.maxGrade === 0) return;
    const ratio = payload.value / payload.maxGrade;
    if (ratio < this.HIGH_GRADE_RATIO) return;
    const student = await this.prisma.user.findUnique({
      where: { id: payload.studentId },
      select: { branchId: true },
    });
    await this.rewards.recordPoints(
      payload.studentId,
      payload.studentId, // النظام يمنح — نستخدم معرّف الطالب كمرجع محايد
      student?.branchId ?? null,
      'HIGH_GRADE',
      this.POINTS_HIGH_GRADE,
      payload.submissionId,
    );
  }
}
