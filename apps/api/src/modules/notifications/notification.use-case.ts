import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { NotificationType } from '@shared';
import {
  PaginationQuery,
  Paginated,
} from '@application/dto/pagination.dto';

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data as never,
      },
    });
  }

  async list(
    userId: string,
    q: PaginationQuery,
  ): Promise<Paginated<NotificationView>> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: res.count };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }
}
