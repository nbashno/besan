import { Body, Controller, Post, Get, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthenticateTelegramUseCase } from '@/modules/auth/authenticate-telegram.use-case';
import { TelegramLoginDto, AuthResultDto, CompleteProfileDto } from '@application/dto/auth.dto';
import { CompleteProfileUseCase } from '@/modules/auth/complete-profile.use-case';
import { CurrentUser, AuthUser } from '@presentation/decorators/current-user.decorator';
import { Public } from '@presentation/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticate: AuthenticateTelegramUseCase,
    private readonly completeProfileUC: CompleteProfileUseCase,
  ) {}

  @Public()
  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'تسجيل الدخول عبر Telegram WebApp' })
  async telegram(@Body() dto: TelegramLoginDto): Promise<AuthResultDto> {
    return this.authenticate.execute(dto.initData);
  }

  @Post('complete-profile')
  @HttpCode(200)
  @ApiOperation({ summary: 'إكمال الملف الشخصي (الاسم والدور والمدرسة)' })
  async completeProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CompleteProfileDto,
  ): Promise<AuthResultDto> {
    return this.completeProfileUC.execute(user.userId, dto);
  }
}
