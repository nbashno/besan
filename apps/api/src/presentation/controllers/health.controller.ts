import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { Public } from '@presentation/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'فحص صحة الخدمة' })
  async check() {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, ts: new Date().toISOString() };
  }
}
