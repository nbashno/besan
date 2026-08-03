import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';

export interface ClassStats {
  classId: string;
  studentCount: number;
  assignmentsPublished: number;
  submissionsTotal: number;
  lateSubmissions: number;
  submissionRate: number; // 0..1
  averageGrade: number | null;
}

export interface StudentSummary {
  studentId: string;
  assignmentsAssigned: number;
  submitted: number;
  late: number;
  averageGrade: number | null;
  totalPoints: number;
  rewardCards: number;
}

@Injectable()
export class AnalyticsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /** إحصاءات صف للمعلم المالك */
  async classStats(classId: string, teacherId: string): Promise<ClassStats> {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });
    if (!cls) throw new NotFoundException('الصف غير موجود');
    if (cls.ownerId !== teacherId) {
      throw new ForbiddenException('لست مالك هذا الصف');
    }

    const [studentCount, assignments] = await Promise.all([
      this.prisma.classMember.count({
        where: { classId, role: 'STUDENT' },
      }),
      this.prisma.assignment.findMany({
        where: { classId, deletedAt: null, published: true },
        select: { id: true },
      }),
    ]);

    const assignmentIds = assignments.map((a: { id: string }) => a.id);
    const assignmentsPublished = assignmentIds.length;

    const [submissionsTotal, lateSubmissions, gradeAgg] = await Promise.all([
      this.prisma.submission.count({
        where: { assignmentId: { in: assignmentIds } },
      }),
      this.prisma.submission.count({
        where: { assignmentId: { in: assignmentIds }, isLate: true },
      }),
      this.prisma.grade.aggregate({
        where: { submission: { assignmentId: { in: assignmentIds } } },
        _avg: { value: true },
      }),
    ]);

    const expected = assignmentsPublished * studentCount;
    const submissionRate =
      expected > 0 ? Math.min(1, submissionsTotal / expected) : 0;

    return {
      classId,
      studentCount,
      assignmentsPublished,
      submissionsTotal,
      lateSubmissions,
      submissionRate,
      averageGrade: gradeAgg._avg.value,
    };
  }

  /**
   * ملخص طالب — للمعلم أو (مستقبلًا) لولي الأمر.
   * يشمل: الواجبات، التسليم، التأخير، المعدل، النقاط، البطاقات.
   * (نسبة الحضور تُضاف عند بناء وحدة الحضور — البنية جاهزة.)
   */
  async studentSummary(studentId: string): Promise<StudentSummary> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    // الصفوف التي ينتمي إليها الطالب
    const memberships = await this.prisma.classMember.findMany({
      where: { userId: studentId, role: 'STUDENT' },
      select: { classId: true },
    });
    const classIds = memberships.map((m: { classId: string }) => m.classId);

    const assignmentsAssigned = await this.prisma.assignment.count({
      where: { classId: { in: classIds }, deletedAt: null, published: true },
    });

    const [submitted, late, gradeAgg, pointsAgg, rewardCards] =
      await Promise.all([
        this.prisma.submission.count({ where: { studentId } }),
        this.prisma.submission.count({ where: { studentId, isLate: true } }),
        this.prisma.grade.aggregate({
          where: { submission: { studentId } },
          _avg: { value: true },
        }),
        this.prisma.pointEntry.aggregate({
          where: { studentId },
          _sum: { value: true },
        }),
        this.prisma.rewardCard.count({ where: { studentId } }),
      ]);

    return {
      studentId,
      assignmentsAssigned,
      submitted,
      late,
      averageGrade: gradeAgg._avg.value,
      totalPoints: pointsAgg._sum.value ?? 0,
      rewardCards,
    };
  }
}
