import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubmissionUseCase } from '@/modules/submissions/submission.use-case';
import {
  SubmitDto,
  GradeDto,
  AttachFileDto,
  SubmissionDto,
} from '@application/dto/submission.dto';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissions: SubmissionUseCase) {}

  @Post('assignment/:assignmentId')
  @ApiOperation({ summary: 'تسليم/استبدال حل (طالب)' })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitDto,
  ): Promise<SubmissionDto> {
    return this.submissions.submit(assignmentId, user.userId, dto);
  }

  @Post('assignment/:assignmentId/upload-url')
  @ApiOperation({ summary: 'رابط رفع موقّع لملف الحل' })
  uploadUrl(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId') assignmentId: string,
    @Body() body: { fileName: string; mimeType: string },
  ): Promise<{ uploadUrl: string; path: string; expiresIn: number }> {
    return this.submissions.requestUpload(
      assignmentId,
      user.userId,
      body.fileName,
      body.mimeType,
    );
  }

  @Post('assignment/:assignmentId/attach')
  @ApiOperation({ summary: 'إرفاق ملف حل بعد الرفع' })
  attach(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: AttachFileDto,
  ): Promise<{ fileId: string }> {
    return this.submissions.attach(assignmentId, user.userId, dto);
  }

  @Get('assignment/:assignmentId/mine')
  @ApiOperation({ summary: 'تسليمي لواجب مع الدرجة والملفات' })
  mine(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId') assignmentId: string,
  ): Promise<unknown> {
    return this.submissions.getMine(assignmentId, user.userId);
  }

  @Get('assignment/:assignmentId/all')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'كل تسليمات واجب (معلم)' })
  all(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId') assignmentId: string,
  ): Promise<SubmissionDto[]> {
    return this.submissions.listForAssignment(assignmentId, user.userId);
  }

  @Post(':id/view')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'وسم التسليم كمقروء (معلم)' })
  view(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SubmissionDto> {
    return this.submissions.markViewed(id, user.userId);
  }

  @Post(':id/grade')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'تصحيح تسليم (معلم)' })
  grade(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GradeDto,
  ): Promise<SubmissionDto> {
    return this.submissions.grade(id, user.userId, dto);
  }
}
