import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachFileDto } from './assignment.dto';

export class SubmitDto {
  @ApiPropertyOptional({ description: 'نص الحل (لواجبات نصية)' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  textContent?: string;
}

export class GradeDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

export { AttachFileDto };

export class SubmissionDto {
  @ApiProperty() id!: string;
  @ApiProperty() assignmentId!: string;
  @ApiProperty() studentId!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() textContent?: string | null;
  @ApiProperty() version!: number;
  @ApiProperty() isLate!: boolean;
  @ApiPropertyOptional() submittedAt?: Date | null;
}
