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
import { AssignmentUseCase } from '@/modules/assignments/assignment.use-case';
import {
  CreateAssignmentDto,
  CreateQuizDto,
  UpdateAssignmentDto,
  AttachFileDto,
  AssignmentDto,
} from '@application/dto/assignment.dto';
import { PaginationQuery, Paginated } from '@application/dto/pagination.dto';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignments: AssignmentUseCase) {}

  @Post('quiz')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  createQuiz(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateQuizDto,
  ) {
    return this.assignments.createQuiz(user.userId, dto);
  }

  @Post()
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'إنشاء واجب (مسودّة)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAssignmentDto,
  ): Promise<AssignmentDto> {
    return this.assignments.create(user.userId, dto);
  }

  @Patch(':id')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'تعديل واجب' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<AssignmentDto> {
    return this.assignments.update(id, user.userId, dto);
  }

  @Post(':id/publish')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'نشر واجب وإشعار الطلاب' })
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<AssignmentDto> {
    return this.assignments.publish(id, user.userId);
  }

  @Delete(':id')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'حذف واجب (soft)' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.assignments.softDelete(id, user.userId);
    return { deleted: true };
  }

  @Post(':id/upload-url')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'طلب رابط رفع موقّع لمرفق' })
  uploadUrl(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string },
  ): Promise<{ uploadUrl: string; path: string; expiresIn: number }> {
    return this.assignments.requestUpload(
      id,
      user.userId,
      body.fileName,
      body.mimeType,
    );
  }

  @Post(':id/attach')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'تسجيل مرفق بعد الرفع' })
  attach(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AttachFileDto,
  ): Promise<{ fileId: string }> {
    return this.assignments.attach(id, user.userId, dto);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'واجبات صف' })
  listForClass(
    @CurrentUser() user: AuthUser,
    @Param('classId') classId: string,
    @Query() q: PaginationQuery,
  ): Promise<Paginated<AssignmentDto>> {
    return this.assignments.listForClass(classId, user.userId, q);
  }

  @Get('by-code/:code')
  openByCode(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ) {
    return this.assignments.openByShareCode(code, user.userId);
  }

  @Get(':id/quiz')
  getQuiz(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.assignments.getQuizForStudent(id, user.userId);
  }

  @Post(':id/quiz/submit')
  submitQuiz(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { answers: { questionId: string; choiceId?: string; writtenText?: string }[] },
  ) {
    return this.assignments.submitQuiz(id, user.userId, body.answers);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل واجب مع المرفقات' })
  details(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<AssignmentDto & { attachments: unknown[] }> {
    return this.assignments.getDetails(id, user.userId);
  }
}
