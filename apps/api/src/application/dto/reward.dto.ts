import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendCardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ description: 'رابط صورة البطاقة (اختياري)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'نقاط مرافقة (0 = بلا نقاط)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointValue?: number;
}

export class AwardPointsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  value!: number;
}

export class RewardCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() message!: string;
  @ApiPropertyOptional() imageUrl?: string | null;
  @ApiProperty() pointValue!: number;
  @ApiProperty() createdAt!: Date;
}

export class StudentPointsDto {
  @ApiProperty() studentId!: string;
  @ApiProperty() total!: number;
}
