import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  AnalyticsUseCase,
  ClassStats,
  StudentSummary,
} from '@/modules/analytics/analytics.use-case';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsUseCase) {}

  @Get('class/:classId')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'إحصاءات صف (معلم)' })
  classStats(
    @CurrentUser() user: AuthUser,
    @Param('classId') classId: string,
  ): Promise<ClassStats> {
    return this.analytics.classStats(classId, user.userId);
  }

  @Get('student/:studentId')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'ملخص طالب (معلم/ولي أمر مستقبلًا)' })
  studentSummary(
    @Param('studentId') studentId: string,
  ): Promise<StudentSummary> {
    return this.analytics.studentSummary(studentId);
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'ملخصي (طالب)' })
  mySummary(@CurrentUser() user: AuthUser): Promise<StudentSummary> {
    return this.analytics.studentSummary(user.userId);
  }
}
