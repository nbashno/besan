import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { CompleteProfileDto, AuthResultDto } from '@application/dto/auth.dto';

@Injectable()
export class CompleteProfileUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async execute(userId: string, dto: CompleteProfileDto): Promise<AuthResultDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    // ربط المدرسة (نموّ عضوي): إن كتب المعلم اسم مدرسة، نبحث/ننشئ منظمة
    let branchId = user.branchId;
    if (dto.role === 'TEACHER' && dto.schoolName && dto.schoolName.trim()) {
      const schoolName = dto.schoolName.trim();
      let org = await this.prisma.organization.findFirst({
        where: { name: schoolName },
        include: { branches: true },
      });
      if (!org) {
        org = await this.prisma.organization.create({
          data: {
            name: schoolName,
            type: "SCHOOL" as never,
            branches: { create: { name: schoolName } },
          },
          include: { branches: true },
        });
      }
      branchId = org.branches[0]?.id ?? null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName.trim(),
        firstName: dto.displayName.trim(),
        role: dto.role,
        schoolName: dto.role === 'TEACHER' ? (dto.schoolName?.trim() || null) : null,
        branchId,
        profileComplete: true,
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: updated.id,
      role: updated.role,
      tid: updated.telegramId.toString(),
    });

    return {
      accessToken,
      userId: updated.id,
      role: updated.role,
      firstName: updated.displayName ?? updated.firstName,
      profileComplete: updated.profileComplete,
      displayName: updated.displayName,
      schoolName: updated.schoolName,
    };
  }
}
