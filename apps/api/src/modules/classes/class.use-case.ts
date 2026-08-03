import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { EventBus } from '@infrastructure/events/event-bus.service';
import { DomainEvent } from '@domain/events/domain-events';
import {
  CreateClassDto,
  UpdateClassDto,
  ClassDto,
} from '@application/dto/class.dto';
import { PaginationQuery, Paginated } from '@application/dto/pagination.dto';

@Injectable()
export class ClassUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

  /** رمز صف قصير مقروء (6 أحرف/أرقام كبيرة) */
  private genCode(): string {
    return randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  }

  async create(ownerId: string, dto: CreateClassDto): Promise<ClassDto> {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('المعلم غير موجود');

    // ضمان تفرّد الرمز
    let code = this.genCode();
    for (let i = 0; i < 5; i++) {
      const clash = await this.prisma.class.findUnique({ where: { code } });
      if (!clash) break;
      code = this.genCode();
    }

    const created = await this.prisma.class.create({
      data: {
        name: dto.name,
        description: dto.description,
        code,
        ownerId,
        branchId: owner.branchId,
        members: {
          create: { userId: ownerId, role: 'TEACHER' },
        },
      },
    });

    this.events.publish(DomainEvent.ClassCreated, {
      classId: created.id,
      ownerId,
    });

    return this.toDto(created, 1);
  }

  async update(
    classId: string,
    ownerId: string,
    dto: UpdateClassDto,
  ): Promise<ClassDto> {
    await this.assertOwner(classId, ownerId);
    const updated = await this.prisma.class.update({
      where: { id: classId },
      data: { name: dto.name, description: dto.description },
    });
    const count = await this.prisma.classMember.count({ where: { classId } });
    return this.toDto(updated, count);
  }

  async archive(classId: string, ownerId: string): Promise<void> {
    await this.assertOwner(classId, ownerId);
    await this.prisma.class.update({
      where: { id: classId },
      data: { archived: true },
    });
  }

  async softDelete(classId: string, ownerId: string): Promise<void> {
    await this.assertOwner(classId, ownerId);
    await this.prisma.class.update({
      where: { id: classId },
      data: { deletedAt: new Date() },
    });
  }

  /** صفوف المعلم (المالك) */
  async listOwned(
    ownerId: string,
    q: PaginationQuery,
  ): Promise<Paginated<ClassDto>> {
    const rows = await this.prisma.class.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      include: { _count: { select: { members: true } } },
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((c: any) => this.toDto(c, c._count.members)),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  /** صفوف الطالب (عضويات) */
  async listJoined(
    userId: string,
    q: PaginationQuery,
  ): Promise<Paginated<ClassDto>> {
    const memberships = await this.prisma.classMember.findMany({
      where: { userId, class: { deletedAt: null, archived: false } },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      include: {
        class: { include: { _count: { select: { members: true } } } },
      },
    });
    const hasMore = memberships.length > q.limit;
    const slice = hasMore ? memberships.slice(0, q.limit) : memberships;
    return {
      items: slice.map((m: any) => this.toDto(m.class, m.class._count.members)),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  /** توليد رابط دعوة (رمز token طويل مع صلاحية اختيارية) */
  async createInvite(
    classId: string,
    ownerId: string,
    maxUses?: number,
    expiresInHours?: number,
  ): Promise<{ token: string; expiresAt: Date | null }> {
    await this.assertOwner(classId, ownerId);
    const token = randomBytes(24).toString('hex');
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 3600 * 1000)
      : null;
    await this.prisma.classInvite.create({
      data: { classId, token, maxUses, expiresAt },
    });
    return { token, expiresAt };
  }

  /** انضمام الطالب برمز الصف أو رمز الدعوة */
  async join(userId: string, code: string): Promise<ClassDto> {
    // جرّب رمز الدعوة أولًا، ثم رمز الصف
    const invite = await this.prisma.classInvite.findUnique({
      where: { token: code },
    });

    let classId: string;
    if (invite) {
      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('انتهت صلاحية رابط الدعوة');
      }
      if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
        throw new BadRequestException('استُنفدت مرات استخدام الدعوة');
      }
      classId = invite.classId;
      await this.prisma.classInvite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });
    } else {
      const cls = await this.prisma.class.findUnique({ where: { code } });
      if (!cls || cls.deletedAt) {
        throw new NotFoundException('الرمز غير صالح');
      }
      classId = cls.id;
    }

    const exists = await this.prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (exists) throw new ConflictException('أنت منضمّ لهذا الصف بالفعل');

    await this.prisma.classMember.create({
      data: { classId, userId, role: 'STUDENT' },
    });

    this.events.publish(DomainEvent.StudentJoinedClass, {
      classId,
      studentId: userId,
    });

    const cls = await this.prisma.class.findUniqueOrThrow({
      where: { id: classId },
      include: { _count: { select: { members: true } } },
    });
    return this.toDto(cls, cls._count.members);
  }

  private async assertOwner(classId: string, ownerId: string): Promise<void> {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });
    if (!cls) throw new NotFoundException('الصف غير موجود');
    if (cls.ownerId !== ownerId) {
      throw new ForbiddenException('لست مالك هذا الصف');
    }
  }

  private toDto(
    c: {
      id: string;
      name: string;
      description: string | null;
      code: string;
      ownerId: string;
      archived: boolean;
      createdAt: Date;
    },
    memberCount: number,
  ): ClassDto {
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      code: c.code,
      ownerId: c.ownerId,
      archived: c.archived,
      memberCount,
      createdAt: c.createdAt,
    };
  }
}
