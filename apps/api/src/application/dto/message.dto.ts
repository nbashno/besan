import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({ description: 'سياق الصف (اختياري)' })
  @IsOptional()
  @IsString()
  classId?: string;
}

export class MessageDto {
  @ApiProperty() id!: string;
  @ApiProperty() senderId!: string;
  @ApiProperty() receiverId!: string;
  @ApiProperty() body!: string;
  @ApiProperty() read!: boolean;
  @ApiProperty() createdAt!: Date;
}
