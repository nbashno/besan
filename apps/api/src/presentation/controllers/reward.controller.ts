import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RewardUseCase } from '@/modules/rewards/reward.use-case';
import {
  SendCardDto,
  AwardPointsDto,
  RewardCardDto,
} from '@application/dto/reward.dto';
import {
  CurrentUser,
  AuthUser,
} from '@presentation/decorators/current-user.decorator';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('rewards')
@ApiBearerAuth()
@Controller('rewards')
export class RewardController {
  constructor(private readonly rewards: RewardUseCase) {}

  @Post('cards')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'إرسال بطاقة تحفيزية (معلم)' })
  sendCard(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendCardDto,
  ): Promise<RewardCardDto> {
    return this.rewards.sendCard(user.userId, dto);
  }

  @Post('points')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'منح نقاط يدوية (معلم)' })
  awardPoints(
    @CurrentUser() user: AuthUser,
    @Body() dto: AwardPointsDto,
  ): Promise<{ total: number }> {
    return this.rewards.awardPoints(user.userId, dto);
  }

  @Get('cards/mine')
  @ApiOperation({ summary: 'بطاقاتي (طالب)' })
  myCards(@CurrentUser() user: AuthUser): Promise<RewardCardDto[]> {
    return this.rewards.listCards(user.userId);
  }

  @Get('points/mine')
  @ApiOperation({ summary: 'رصيد نقاطي (طالب)' })
  async myPoints(
    @CurrentUser() user: AuthUser,
  ): Promise<{ total: number }> {
    return { total: await this.rewards.getTotal(user.userId) };
  }

  @Get('points/:studentId')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'رصيد نقاط طالب (معلم/إداري)' })
  async studentPoints(
    @Param('studentId') studentId: string,
  ): Promise<{ total: number }> {
    return { total: await this.rewards.getTotal(studentId) };
  }

  @Get('cards/:studentId')
  @Roles('TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN')
  @ApiOperation({ summary: 'بطاقات طالب (معلم/إداري)' })
  studentCards(
    @Param('studentId') studentId: string,
  ): Promise<RewardCardDto[]> {
    return this.rewards.listCards(studentId);
  }
}
