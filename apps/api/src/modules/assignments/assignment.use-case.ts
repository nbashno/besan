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
}
