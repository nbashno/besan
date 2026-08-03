import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class JoinClassDto {
  @ApiProperty({ description: 'رمز الصف أو رمز الدعوة' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ClassDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() ownerId!: string;
  @ApiProperty() archived!: boolean;
  @ApiProperty() memberCount!: number;
  @ApiProperty() createdAt!: Date;
}
