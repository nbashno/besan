import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { EventBus } from '@infrastructure/events/event-bus.service';
import { DomainEvent } from '@domain/events/domain-events';
import { SendMessageDto, MessageDto } from '@application/dto/message.dto';
import {
  PaginationQuery,
  Paginated,
} from '@application/dto/pagination.dto';

@Injectable()
export class MessageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

  async send(senderId: string, dto: SendMessageDto): Promise<MessageDto> {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('المستقبِل غير موجود');

    // شرط: يجب أن يتشاركا صفًا واحدًا على الأقل (معلم↔طالب)
    await this.assertShareClass(senderId, dto.receiverId);

    const msg = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        classId: dto.classId,
        body: dto.body,
      },
    });

    this.events.publish(DomainEvent.MessageSent, {
      messageId: msg.id,
      senderId,
      receiverId: dto.receiverId,
    });

    return this.toDto(msg);
  }

  /** المحادثة بين طرفين (كلا الاتجاهين) */
  async conversation(
    userId: string,
    otherId: string,
    q: PaginationQuery,
  ): Promise<Paginated<MessageDto>> {
    const rows = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((m: any) => this.toDto(m)),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  /** وسم رسائل المحادثة كمقروءة */
  async markRead(userId: string, otherId: string): Promise<{ updated: number }> {
    const res = await this.prisma.message.updateMany({
      where: { senderId: otherId, receiverId: userId, read: false },
      data: { read: true },
    });
    return { updated: res.count };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, read: false },
    });
    return { count };
  }

  private async assertShareClass(a: string, b: string): Promise<void> {
    // اجلب صفوف a ثم تحقق أن b عضو في أحدها
    const aClasses = await this.prisma.classMember.findMany({
      where: { userId: a },
      select: { classId: true },
    });
    if (aClasses.length === 0) {
      throw new ForbiddenException('لا صف مشترك بينكما');
    }
    const shared = await this.prisma.classMember.findFirst({
      where: { userId: b, classId: { in: aClasses.map((c: { classId: string }) => c.classId) } },
    });
    if (!shared) throw new ForbiddenException('لا صف مشترك بينكما');
  }

  private toDto(m: {
    id: string;
    senderId: string;
    receiverId: string;
    body: string;
    read: boolean;
    createdAt: Date;
  }): MessageDto {
    return {
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt,
    };
  }
}
