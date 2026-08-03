import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { StoragePort } from '@application/ports/storage.port';
import { EventBus } from '@infrastructure/events/event-bus.service';
import {
  DomainEvent,
  SubmissionCreatedPayload,
  SubmissionGradedPayload,
} from '@domain/events/domain-events';
import {
  SubmitDto,
  GradeDto,
  AttachFileDto,
  SubmissionDto,
} from '@application/dto/submission.dto';

@Injectable()
export class SubmissionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragePort,
    private readonly events: EventBus,
  ) {}

  /**
   * تسليم أو استبدال. قبل الموعد: يُنشئ نسخة جديدة ويحفظ لقطة في التاريخ.
   * بعد الموعد: يُسمح بالتسليم لكن يُوسم isLate.
   */
  async submit(
    assignmentId: string,
    studentId: string,
    dto: SubmitDto,
  ): Promise<SubmissionDto> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null, published: true },
      include: { class: true },
    });
    if (!assignment) throw new NotFoundException('الواجب غير متاح');

    const membership = await this.prisma.classMember.findUnique({
      where: {
        classId_userId: { classId: assignment.classId, userId: studentId },
      },
    });
    if (!membership) throw new ForbiddenException('لست عضوًا في الصف');

    const isLate = assignment.dueAt
      ? Date.now() > assignment.dueAt.getTime()
      : false;

    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });

    // لا يُسمح بالاستبدال بعد التصحيح
    if (existing && ['GRADED', 'RETURNED'].includes(existing.status)) {
      throw new BadRequestException('لا يمكن التعديل بعد التصحيح');
    }

    let submission;
    if (existing) {
      // حفظ لقطة من النسخة الحالية قبل الاستبدال
      await this.prisma.submissionHistory.create({
        data: {
          submissionId: existing.id,
          version: existing.version,
          textContent: existing.textContent,
        },
      });
      submission = await this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          textContent: dto.textContent,
          version: { increment: 1 },
          isLate,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      this.events.publish(DomainEvent.SubmissionReplaced, {
        submissionId: submission.id,
      });
    } else {
      submission = await this.prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          textContent: dto.textContent,
          isLate,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    }

    // حدث الإنشاء → إشعار المعلم + منح نقاط إن كان في الموعد
    this.events.publish<SubmissionCreatedPayload>(
      DomainEvent.SubmissionCreated,
      {
        submissionId: submission.id,
        assignmentId,
        studentId,
        teacherId: assignment.authorId,
        isLate,
      },
    );

    return this.toDto(submission);
  }

  async requestUpload(
    assignmentId: string,
    studentId: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; path: string; expiresIn: number }> {
    const membership = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
    });
    if (!membership) throw new NotFoundException('الواجب غير موجود');
    return this.storage.createSignedUpload(fileName, mimeType);
  }

  async attach(
    assignmentId: string,
    studentId: string,
    dto: AttachFileDto,
  ): Promise<{ fileId: string }> {
    const submission = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (!submission) {
      throw new BadRequestException('أنشئ التسليم قبل إرفاق الملفات');
    }
    if (['GRADED', 'RETURNED'].includes(submission.status)) {
      throw new BadRequestException('لا يمكن التعديل بعد التصحيح');
    }
    const file = await this.prisma.fileObject.create({
      data: {
        bucket: 'baysan',
        path: dto.path,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
        submissionId: submission.id,
        uploadedById: studentId,
      },
    });
    return { fileId: file.id };
  }

  /** المعلم يفتح التسليم → يُوسم VIEWED */
  async markViewed(
    submissionId: string,
    teacherId: string,
  ): Promise<SubmissionDto> {
    const sub = await this.getForTeacher(submissionId, teacherId);
    if (sub.status === 'SUBMITTED') {
      const updated = await this.prisma.submission.update({
        where: { id: sub.id },
        data: { status: 'VIEWED', viewedAt: new Date() },
      });
      return this.toDto(updated);
    }
    return this.toDto(sub);
  }

  /** تصحيح: يكتب الدرجة والملاحظة، يوسم GRADED، يطلق حدث → إشعار الطالب */
  async grade(
    submissionId: string,
    teacherId: string,
    dto: GradeDto,
  ): Promise<SubmissionDto> {
    const sub = await this.getForTeacher(submissionId, teacherId);
    const assignment = await this.prisma.assignment.findUniqueOrThrow({
      where: { id: sub.assignmentId },
    });

    if (assignment.maxGrade != null && dto.value > assignment.maxGrade) {
      throw new BadRequestException('الدرجة تتجاوز الحد الأقصى');
    }

    await this.prisma.grade.upsert({
      where: { submissionId },
      create: {
        submissionId,
        graderId: teacherId,
        value: dto.value,
        feedback: dto.feedback,
      },
      update: { value: dto.value, feedback: dto.feedback, graderId: teacherId },
    });

    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' },
    });

    this.events.publish<SubmissionGradedPayload>(DomainEvent.SubmissionGraded, {
      submissionId,
      studentId: sub.studentId,
      value: dto.value,
      maxGrade: assignment.maxGrade,
    });

    return this.toDto(updated);
  }

  /** تسليمات واجب (للمعلم) */
  async listForAssignment(
    assignmentId: string,
    teacherId: string,
  ): Promise<SubmissionDto[]> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('الواجب غير موجود');
    if (assignment.authorId !== teacherId) {
      throw new ForbiddenException('لست صاحب هذا الواجب');
    }
    const subs = await this.prisma.submission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
    });
    return subs.map((s: any) => this.toDto(s));
  }

  /** تسليم الطالب لواجب معيّن مع الدرجة والملفات */
  async getMine(
    assignmentId: string,
    studentId: string,
  ): Promise<
    (SubmissionDto & { grade: unknown; files: unknown[] }) | null
  > {
    const sub = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      include: { grade: true, files: { where: { deletedAt: null } } },
    });
    if (!sub) return null;
    const files = await Promise.all(
      sub.files.map(async (f: any) => ({
        id: f.id,
        fileName: f.fileName,
        downloadUrl: (await this.storage.createSignedDownload(f.path))
          .downloadUrl,
      })),
    );
    return {
      ...this.toDto(sub),
      grade: sub.grade
        ? { value: sub.grade.value, feedback: sub.grade.feedback }
        : null,
      files,
    };
  }

  private async getForTeacher(submissionId: string, teacherId: string) {
    const sub = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });
    if (!sub) throw new NotFoundException('التسليم غير موجود');
    if (sub.assignment.authorId !== teacherId) {
      throw new ForbiddenException('لست صاحب الواجب');
    }
    return sub;
  }

  private toDto(s: {
    id: string;
    assignmentId: string;
    studentId: string;
    status: string;
    textContent: string | null;
    version: number;
    isLate: boolean;
    submittedAt: Date | null;
  }): SubmissionDto {
    return {
      id: s.id,
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      status: s.status,
      textContent: s.textContent,
      version: s.version,
      isLate: s.isLate,
      submittedAt: s.submittedAt,
    };
  }
}
