import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsNumber,
  MaxLength,
  Min,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ASSIGNMENT_TYPES, AssignmentType } from '@shared';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: ASSIGNMENT_TYPES, default: 'TEXT' })
  @IsOptional()
  @IsEnum(ASSIGNMENT_TYPES)
  type?: AssignmentType;

  @ApiPropertyOptional({ description: 'Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªØ³Ù„ÙŠÙ… ISO8601' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxGrade?: number;

  @ApiPropertyOptional({ description: 'Ù…Ø¹Ø±Ù‘Ù Ù…Ø­Ø§ÙƒØ§Ø© PhET Ø§Ù„Ù…Ø±ÙÙ‚Ø©' })
  @IsOptional()
  @IsString()
  phetSlug?: string;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxGrade?: number;
}

/** ØªØ³Ø¬ÙŠÙ„ Ù…Ø±ÙÙ‚ Ø¨Ø¹Ø¯ Ø±ÙØ¹Ù‡ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø¹Ø¨Ø± Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ù…ÙˆÙ‚Ù‘Ø¹ */
export class AttachFileDto {
  @ApiProperty() @IsString() @IsNotEmpty() path!: string;
  @ApiProperty() @IsString() @IsNotEmpty() fileName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() mimeType!: string;
  @ApiProperty() @IsNumber() @Min(0) size!: number;
}

export class AssignmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() classId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() type!: string;
  @ApiPropertyOptional() dueAt?: Date | null;
  @ApiPropertyOptional() maxGrade?: number | null;
  @ApiPropertyOptional() phetSlug?: string | null;
  @ApiProperty() published!: boolean;
  @ApiProperty() createdAt!: Date;
}


export class QuizChoiceDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class QuizQuestionDto {
  @ApiProperty({ enum: ['MCQ', 'WRITTEN'] })
  @IsString()
  type!: 'MCQ' | 'WRITTEN';

  @ApiProperty()
  @IsString()
  text!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @ApiProperty({ type: [QuizChoiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices!: QuizChoiceDto[];
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
  classId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phetSlug?: string;

  @ApiProperty({ type: [QuizQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}
