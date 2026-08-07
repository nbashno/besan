import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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
  @ApiProperty() profileComplete!: boolean;
  @ApiProperty() displayName?: string | null;
  @ApiProperty() schoolName?: string | null;
}

export class CompleteProfileDto {
  @ApiProperty({ description: 'الاسم الكامل' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ enum: ['TEACHER', 'STUDENT'] })
  @IsString()
  @IsNotEmpty()
  role!: 'TEACHER' | 'STUDENT';

  @ApiProperty({ required: false, description: 'اسم المدرسة (للمعلم)' })
  @IsOptional()
  @IsString()
  schoolName?: string;
}
