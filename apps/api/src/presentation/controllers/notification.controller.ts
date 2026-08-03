import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  NotificationUseCase,
  NotificationView,
} from '@/modules/notifications/notification.use-case';
import { PaginationQuery, Paginated } from '@application/dto/pagination.dto';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationUseCase) {}

  @Get()
  @ApiOperation({ summary: 'إشعاراتي' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PaginationQuery,
  ): Promise<Paginated<NotificationView>> {
    return this.notifications.list(user.userId, q);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'عدد غير المقروء' })
  unread(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return this.notifications.unreadCount(user.userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'وسم الكل كمقروء' })
  readAll(@CurrentUser() user: AuthUser): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.userId);
  }
}
