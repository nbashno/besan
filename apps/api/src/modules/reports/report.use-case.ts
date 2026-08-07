import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';

export interface StudentReport {
  student: { name: string; className: string };
  teacher: { name: string };
  school: string | null;
  period: { month: string; year: number };
  stats: {
    totalQuizzes: number;
    completed: number;
    completionRate: number;
    average: number;
    highest: number;
    lowest: number;
    onTimeRate: number;
  };
  quizzes: {
    title: string;
    score: number | null;
    total: number;
    date: string;
    status: 'graded' | 'pending';
  }[];
  strengths: string[];
  improvements: string[];
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

@Injectable()
export class ReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async studentMonthly(
    studentId: string,
    classId: string,
    year?: number,
    month?: number,
  ): Promise<StudentReport> {
    const now = new Date();
    const y = year ?? now.getFullYear();
    // الشهر المطلوب (افتراضيًا الشهر السابق للتقرير الشهري)
    const m = month ?? now.getMonth(); // 0-11
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        owner: true,
        branch: { include: { organization: true } },
      },
    });
    if (!cls) throw new NotFoundException('الصف غير موجود');

    // اختبارات الصف في الفترة
    const assignments = await this.prisma.assignment.findMany({
      where: {
        classId,
        isQuiz: true,
        deletedAt: null,
        createdAt: { gte: start, lt: end },
      },
      include: {
        questions: true,
        submissions: {
          where: { studentId },
          include: { grade: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const quizzes = assignments.map((a: any) => {
      const sub = a.submissions[0];
      const total = a.questions.reduce(
        (s: number, q: { points: number }) => s + q.points,
        0,
      );
      const graded = sub?.grade != null;
      return {
        title: a.title,
        score: graded ? sub!.grade!.value : null,
        total,
        date: a.createdAt.toISOString().slice(0, 10),
        status: (graded ? 'graded' : 'pending') as 'graded' | 'pending',
        onTime: sub ? !sub.isLate : false,
        submitted: !!sub,
      };
    });

    const gradedQuizzes = quizzes.filter((q: any) => q.status === 'graded');
    const scores = gradedQuizzes.map((q: any) =>
      q.total > 0 ? (q.score! / q.total) * 100 : 0,
    );
    const average =
      scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
    const highest = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
    const lowest = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;
    const completed = quizzes.filter((q: any) => q.submitted).length;
    const onTime = quizzes.filter((q: any) => q.onTime).length;

    // نقاط القوة والتحسين (بسيطة، مبنية على الأداء)
    const strengths: string[] = [];
    const improvements: string[] = [];
    if (average >= 85) strengths.push('أداء ممتاز ومستوى عالٍ من الإتقان');
    else if (average >= 70) strengths.push('أداء جيد ومستقر');
    if (completed === assignments.length && assignments.length > 0)
      strengths.push('التزام كامل بحل جميع الاختبارات');
    if (onTime === completed && completed > 0)
      strengths.push('انضباط ممتاز في المواعيد');

    if (average < 60 && gradedQuizzes.length > 0)
      improvements.push('يُنصح بمراجعة المواضيع الأساسية وتعزيز الفهم');
    if (completed < assignments.length)
      improvements.push(
        `لم يُكمل ${assignments.length - completed} اختبارًا — يُنصح بالمتابعة`,
      );
    if (onTime < completed)
      improvements.push('يُنصح بالالتزام بمواعيد التسليم');
    if (strengths.length === 0)
      strengths.push('بداية الطريق — نتطلع لأداء أفضل');
    if (improvements.length === 0)
      improvements.push('استمر على هذا المستوى الرائع!');

    return {
      student: {
        name: student.displayName ?? student.firstName ?? 'طالب',
        className: cls.name,
      },
      teacher: {
        name: cls.owner.displayName ?? cls.owner.firstName ?? 'المعلم',
      },
      school: cls.branch?.organization?.name ?? null,
      period: { month: AR_MONTHS[m], year: y },
      stats: {
        totalQuizzes: assignments.length,
        completed,
        completionRate:
          assignments.length > 0
            ? Math.round((completed / assignments.length) * 100)
            : 0,
        average,
        highest,
        lowest,
        onTimeRate:
          completed > 0 ? Math.round((onTime / completed) * 100) : 0,
      },
      quizzes: quizzes.map((q: any) => ({
        title: q.title,
        score: q.score,
        total: q.total,
        date: q.date,
        status: q.status,
      })),
      strengths,
      improvements,
    };
  }
}
