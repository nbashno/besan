import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassUseCase } from '@/modules/classes/class.use-case';
import {
  CreateClassDto,
  UpdateClassDto,
  JoinClassDto,
  ClassDto,
} from '@application/dto/class.dto';
import { PaginationQuery, Paginated } from '@application/dto/pagination.dto';
import { CurrentUser, AuthUser } from '@presentation/decorators/current-user.decorator';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassController {
  constructor(private readonly classes: ClassUseCase) {}

  @Post()
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'إنشاء صف (معلم)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClassDto,
  ): Promise<ClassDto> {
    return this.classes.create(user.userId, dto);
  }

  @Get('owned')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'صفوفي كمعلم' })
  listOwned(
    @CurrentUser() user: AuthUser,
    @Query() q: PaginationQuery,
  ): Promise<Paginated<ClassDto>> {
    return this.classes.listOwned(user.userId, q);
  }

  @Get('joined')
  @ApiOperation({ summary: 'صفوفي كطالب' })
  listJoined(
    @CurrentUser() user: AuthUser,
    @Query() q: PaginationQuery,
  ): Promise<Paginated<ClassDto>> {
    return this.classes.listJoined(user.userId, q);
  }

  @Patch(':id')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'تعديل صف' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ClassDto> {
    return this.classes.update(id, user.userId, dto);
  }

  @Post(':id/archive')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'أرشفة صف' })
  async archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ archived: true }> {
    await this.classes.archive(id, user.userId);
    return { archived: true };
  }

  @Delete(':id')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'حذف صف (soft)' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.classes.softDelete(id, user.userId);
    return { deleted: true };
  }

  @Post(':id/invite')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'إنشاء رابط دعوة' })
  invite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { maxUses?: number; expiresInHours?: number },
  ): Promise<{ token: string; expiresAt: Date | null }> {
    return this.classes.createInvite(
      id,
      user.userId,
      body.maxUses,
      body.expiresInHours,
    );
  }

  @Post('join')
  @ApiOperation({ summary: 'انضمام برمز الصف أو الدعوة (طالب)' })
  join(
    @CurrentUser() user: AuthUser,
    @Body() dto: JoinClassDto,
  ): Promise<ClassDto> {
    return this.classes.join(user.userId, dto.code);
  }
}
