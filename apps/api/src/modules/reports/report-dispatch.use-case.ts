import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { NotificationPort } from '@application/ports/notification.port';

@Injectable()
export class ReportDispatchUseCase {
  private readonly logger = new Logger(ReportDispatchUseCase.name);
  private readonly WEBAPP_URL = 'https://t.me/Besan_bot/app';
  private readonly WEB_URL = 'https://besan-web.vercel.app';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationPort,
  ) {}

  // يُشغّل أول كل شهر — يرسل تقرير الشهر السابق لطلاب المعلمين (PRO/INSTITUTIONAL)
  async runMonthly(): Promise<{ sent: number }> {
    // المعلمون المؤهّلون
    const proTeachers = await this.prisma.user.findMany({
      where: { plan: { in: ['PRO', 'INSTITUTIONAL'] } },
      select: { id: true },
    });
    const teacherIds = proTeachers.map((t: { id: string }) => t.id);
    if (teacherIds.length === 0) return { sent: 0 };

    // صفوف هؤلاء المعلمين
    const classes = await this.prisma.class.findMany({
      where: { ownerId: { in: teacherIds }, deletedAt: null, archived: false },
      include: {
        members: {
          where: { role: 'STUDENT' },
          include: { user: { select: { id: true, telegramId: true } } },
        },
      },
    });

    let sent = 0;
    for (const cls of classes) {
      for (const m of cls.members) {
        const tgId = m.user?.telegramId;
        if (!tgId) continue;
        const link = `${this.WEB_URL}/report?s=${m.user.id}&c=${cls.id}`;
        try {
          await this.notify.send({
            telegramId: tgId,
            title: '📄 تقريرك الشهري جاهز',
            body: `تقرير أدائك في ${cls.name} — اطّلع عليه أنت وولي أمرك`,
            deepLink: link,
          });
          sent++;
        } catch (e) {
          this.logger.warn(`فشل إرسال تقرير للطالب ${m.user.id}`);
        }
      }
    }
    this.logger.log(`تقارير شهرية أُرسلت: ${sent}`);
    return { sent };
  }
}
