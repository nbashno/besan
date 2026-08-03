import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthenticateTelegramUseCase } from '@/modules/auth/authenticate-telegram.use-case';
import { TelegramLoginDto, AuthResultDto } from '@application/dto/auth.dto';
import { Public } from '@presentation/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authenticate: AuthenticateTelegramUseCase) {}

  @Public()
  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'تسجيل الدخول عبر Telegram WebApp' })
  async telegram(@Body() dto: TelegramLoginDto): Promise<AuthResultDto> {
    return this.authenticate.execute(dto.initData);
  }
}
