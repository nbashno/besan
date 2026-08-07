import { Controller, Get, Post, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@presentation/decorators/public.decorator';
import { CurrentUser, AuthUser } from '@presentation/decorators/current-user.decorator';
import { ReportUseCase } from '@/modules/reports/report.use-case';
import { ReportDispatchUseCase } from '@/modules/reports/report-dispatch.use-case';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reports: ReportUseCase,
    private readonly dispatch: ReportDispatchUseCase,
  ) {}

  // صفحة الشهادة تجلب البيانات (عامة — الرابط يحوي المعرّفات)
  @Public()
  @Get('student')
  @ApiOperation({ summary: 'بيانات تقرير الطالب الشهري' })
  student(
    @Query('s') studentId: string,
    @Query('c') classId: string,
    @Query('y') year?: string,
    @Query('m') month?: string,
  ) {
    return this.reports.studentMonthly(
      studentId,
      classId,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }

  // نقطة الإرسال الشهري — تُنادى من cron خارجي بمفتاح سرّي
  @Public()
  @Post('run-monthly')
  @ApiOperation({ summary: 'تشغيل الإرسال الشهري (cron)' })
  async runMonthly(@Headers('x-cron-key') key: string) {
    if (key !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('مفتاح غير صالح');
    }
    return this.dispatch.runMonthly();
  }

  @Get("status")
  reportStatus(@CurrentUser() user: AuthUser) {
    return this.dispatch.statusForTeacher(user.userId);
  }

  @Post("send-now")
  sendNow(@CurrentUser() user: AuthUser) {
    return this.dispatch.sendForTeacher(user.userId);
  }

}
