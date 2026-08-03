import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessageUseCase } from '@/modules/messaging/message.use-case';
import { SendMessageDto, MessageDto } from '@application/dto/message.dto';
import { PaginationQuery, Paginated } from '@application/dto/pagination.dto';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messages')
export class MessageController {
  constructor(private readonly messages: MessageUseCase) {}

  @Post()
  @ApiOperation({ summary: 'إرسال رسالة' })
  send(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageDto> {
    return this.messages.send(user.userId, dto);
  }

  @Get('with/:otherId')
  @ApiOperation({ summary: 'محادثة مع مستخدم' })
  conversation(
    @CurrentUser() user: AuthUser,
    @Param('otherId') otherId: string,
    @Query() q: PaginationQuery,
  ): Promise<Paginated<MessageDto>> {
    return this.messages.conversation(user.userId, otherId, q);
  }

  @Post('with/:otherId/read')
  @ApiOperation({ summary: 'وسم المحادثة كمقروءة' })
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('otherId') otherId: string,
  ): Promise<{ updated: number }> {
    return this.messages.markRead(user.userId, otherId);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'عدد الرسائل غير المقروءة' })
  unread(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return this.messages.unreadCount(user.userId);
  }
}
