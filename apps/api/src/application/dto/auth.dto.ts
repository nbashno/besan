import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TelegramLoginDto {
  @ApiProperty({ description: 'سلسلة initData من Telegram WebApp' })
  @IsString()
  @IsNotEmpty()
  initData!: string;
}

export class AuthResultDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() role!: string;
  @ApiProperty() firstName!: string;
}
