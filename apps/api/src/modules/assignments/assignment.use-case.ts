import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { StoragePort } from '@application/ports/storage.port';
import { EventBus } from '@infrastructure/events/event-bus.service';
import {
  DomainEvent,
  AssignmentCreatedPayload,
} from '@domain/events/domain-events';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AttachFileDto,
  AssignmentDto,
  CreateQuizDto,
} from '@application/dto/assignment.dto';
import {
  PaginationQuery,
  Paginated,
} from '@application/dto/pagination.dto';

@Injectable()
export class AssignmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragePort,
    private readonly events: EventBus,
  ) {}

  async create(
    authorId: string,
    dto: CreateAssignmentDto,
  ): Promise<AssignmentDto> {
    await this.assertClassOwner(dto.classId, authorId);
    const a = await this.prisma.assignment.create({
      data: {
        classId: dto.classId,
        authorId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? 'TEXT',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        maxGrade: dto.maxGrade,
        phetSlug: dto.phetSlug,
      },
    });
    return this.toDto(a);
  }

  async update(
    id: string,
    authorId: string,
    dto: UpdateAssignmentDto,
  ): Promise<AssignmentDto> {
    const a = await this.getOwned(id, authorId);
    const updated = await this.prisma.assignment.update({
      where: { id: a.id },
      data: {
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        maxGrade: dto.maxGrade,
      },
    });
    return this.toDto(updated);
  }

  /** النشر يُطلق حدث AssignmentCreated → إشعار الطلاب */
  async publish(id: string, authorId: string): Promise<AssignmentDto> {
    const a = await this.getOwned(id, authorId);
    const updated = await this.prisma.assignment.update({
      where: { id: a.id },
      data: { published: true },
    });
    this.events.publish<AssignmentCreatedPayload>(
      DomainEvent.AssignmentCreated,
      {
        assignmentId: updated.id,
        classId: updated.classId,
        title: updated.title,
        dueAt: updated.dueAt ? updated.dueAt.toISOString() : null,
      },
    );
    return this.toDto(updated);
  }

  async softDelete(id: string, authorId: string): Promise<void> {
    const a = await this.getOwned(id, authorId);
    await this.prisma.assignment.update({
      where: { id: a.id },
      data: { deletedAt: new Date() },
    });
  }

  /** رابط رفع موقّع للمرفق — المتصفح يرفع مباشرة للتخزين */
  async requestUpload(
    id: string,
    authorId: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; path: string; expiresIn: number }> {
    await this.getOwned(id, authorId);
    return this.storage.createSignedUpload(fileName, mimeType);
  }

  /** تسجيل المرفق في القاعدة بعد نجاح الرفع (المسار فقط) */
  async attach(
    id: string,
    authorId: string,
    dto: AttachFileDto,
  ): Promise<{ fileId: string }> {
    await this.getOwned(id, authorId);
    const file = await this.prisma.fileObject.create({
      data: {
        bucket: 'baysan',
        path: dto.path,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
        assignmentId: id,
        uploadedById: authorId,
      },
    });
    return { fileId: file.id };
  }

  /** واجبات صف (للطالب: المنشورة فقط) */
  async listForClass(
    classId: string,
    userId: string,
    q: PaginationQuery,
  ): Promise<Paginated<AssignmentDto>> {
    const membership = await this.prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (!membership) throw new ForbiddenException('لست عضوًا في هذا الصف');

    const isTeacher = membership.role === 'TEACHER';
    const rows = await this.prisma.assignment.findMany({
      where: {
        classId,
        deletedAt: null,
        ...(isTeacher ? {} : { published: true }),
      },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((a: any) => this.toDto(a)),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async getDetails(
    id: string,
    userId: string,
  ): Promise<AssignmentDto & { attachments: unknown[] }> {
    const a = await this.prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        attachments: { where: { deletedAt: null } },
      },
    });
    if (!a) throw new NotFoundException('الواجب غير موجود');

    // تحقق العضوية
    const membership = await this.prisma.classMember.findUnique({
      where: { classId_userId: { classId: a.classId, userId } },
    });
    if (!membership) throw new ForbiddenException('غير مصرّح');
    if (!a.published && membership.role !== 'TEACHER') {
      throw new ForbiddenException('الواجب غير منشور');
    }

    // أرفق روابط تنزيل موقّعة للمرفقات
    const attachments = await Promise.all(
      a.attachments.map(async (f: any) => ({
        id: f.id,
        fileName: f.fileName,
        mimeType: f.mimeType,
        size: f.size,
        downloadUrl: (await this.storage.createSignedDownload(f.path))
          .downloadUrl,
      })),
    );
    return { ...this.toDto(a), attachments };
  }

  private async assertClassOwner(
    classId: string,
    userId: string,
  ): Promise<void> {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });
    if (!cls) throw new NotFoundException('الصف غير موجود');
    if (cls.ownerId !== userId) {
      throw new ForbiddenException('لست مالك هذا الصف');
    }
  }

  private async getOwned(id: string, authorId: string) {
    const a = await this.prisma.assignment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!a) throw new NotFoundException('الواجب غير موجود');
    if (a.authorId !== authorId) {
      throw new ForbiddenException('لست صاحب هذا الواجب');
    }
    return a;
  }

  private toDto(a: {
    id: string;
    classId: string;
    title: string;
    description: string | null;
    type: string;
    dueAt: Date | null;
    maxGrade: number | null;
    phetSlug: string | null;
    published: boolean;
    createdAt: Date;
  }): AssignmentDto {
    return {
      id: a.id,
      classId: a.classId,
      title: a.title,
      description: a.description,
      type: a.type,
      dueAt: a.dueAt,
      maxGrade: a.maxGrade,
      phetSlug: a.phetSlug,
      published: a.published,
      createdAt: a.createdAt,
    };
  }

  async createQuiz(authorId: string, dto: CreateQuizDto) {
    await this.assertClassOwner(dto.classId, authorId);
    const result = await this.prisma.$transaction(async (tx) => {
      const a = await tx.assignment.create({
        data: {
          classId: dto.classId,
          authorId,
          title: dto.title,
          description: dto.description,
          type: 'QUIZ',
          isQuiz: true,
          autoGrade: true,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          phetSlug: dto.phetSlug,
        },
      });
      for (let qi = 0; qi < dto.questions.length; qi++) {
        const q = dto.questions[qi];
        await tx.question.create({
          data: {
            assignmentId: a.id,
            type: q.type,
            text: q.text,
            order: qi,
            points: q.points ?? 1,
            choices: {
              create: (q.choices ?? []).map((c, ci) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                order: ci,
              })),
            },
          },
        });
      }
      return a;
    });
    return { id: result.id, title: result.title, classId: result.classId };
  }

  async getQuizForStudent(assignmentId: string, userId: string) {
    const a = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { choices: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!a) throw new NotFoundException('الاختبار غير موجود');
    if (!a.isQuiz) throw new ForbiddenException('هذا ليس اختبارًا');

    await this.ensureMember(a.classId, userId);

    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: userId } },
      include: { grade: true },
    });

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      phetSlug: a.phetSlug,
      dueAt: a.dueAt,
      alreadySubmitted: existing?.status === 'SUBMITTED',
      score: existing?.grade?.value ?? null,
      questions: a.questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      })),
    };
  }

  async submitQuiz(
    assignmentId: string,
    userId: string,
    answers: { questionId: string; choiceId?: string; writtenText?: string }[],
  ) {
    const a = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        questions: { include: { choices: true } },
      },
    });
    if (!a) throw new NotFoundException('الاختبار غير موجود');
    if (!a.isQuiz) throw new ForbiddenException('هذا ليس اختبارًا');
    await this.ensureMember(a.classId, userId);

    const prior = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    });
    if (prior?.status === 'SUBMITTED') {
      throw new ForbiddenException('تم تسليم هذا الاختبار مسبقًا');
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const answerRows: {
      questionId: string;
      choiceId: string | null;
      writtenText: string | null;
      isCorrect: boolean | null;
      awardedPoints: number | null;
    }[] = [];

    for (const q of a.questions) {
      totalPoints += q.points;
      const submitted = answers.find((x) => x.questionId === q.id);
      if (q.type === 'MCQ') {
        const correctChoice = q.choices.find((c) => c.isCorrect);
        const isCorrect =
          !!submitted?.choiceId && submitted.choiceId === correctChoice?.id;
        const awarded = isCorrect ? q.points : 0;
        earnedPoints += awarded;
        answerRows.push({
          questionId: q.id,
          choiceId: submitted?.choiceId ?? null,
          writtenText: null,
          isCorrect,
          awardedPoints: awarded,
        });
      } else {
        answerRows.push({
          questionId: q.id,
          choiceId: null,
          writtenText: submitted?.writtenText ?? '',
          isCorrect: null,
          awardedPoints: null,
        });
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.upsert({
        where: {
          assignmentId_studentId: { assignmentId, studentId: userId },
        },
        create: {
          assignmentId,
          studentId: userId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
        update: { status: 'SUBMITTED', submittedAt: new Date() },
      });

      await tx.answer.deleteMany({ where: { submissionId: submission.id } });
      for (const r of answerRows) {
        await tx.answer.create({
          data: {
            submissionId: submission.id,
            questionId: r.questionId,
            choiceId: r.choiceId,
            writtenText: r.writtenText,
            isCorrect: r.isCorrect,
            awardedPoints: r.awardedPoints,
          },
        });
      }

      await tx.grade.upsert({
        where: { submissionId: submission.id },
        create: {
          submissionId: submission.id,
          graderId: userId,
          value: earnedPoints,
          feedback: 'تصحيح تلقائي',
        },
        update: { value: earnedPoints },
      });

      return submission;
    });

    return {
      submissionId: result.id,
      score: earnedPoints,
      total: totalPoints,
      results: answerRows.map((r) => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        awardedPoints: r.awardedPoints,
      })),
    };
  }

  private async ensureMember(classId: string, userId: string) {
    const m = await this.prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (!m) {
      throw new ForbiddenException('لست عضوًا في هذا الصف');
    }
    return m;
  }
}