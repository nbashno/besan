import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'بيانات المستخدم الحالي' })
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        role: true,
        branchId: true,
      },
    });
    return found;
  }
}
