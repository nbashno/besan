import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ترقيم بالمؤشر (cursor-based) — أداء ثابت مهما كبر الجدول،
 * عكس offset الذي يتباطأ مع الصفحات البعيدة.
 */
export class PaginationQuery {
  @ApiPropertyOptional({ description: 'مؤشر البداية (id آخر عنصر سابق)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'عدد العناصر (1-50)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/** يبني نتيجة مرقّمة من صفٍّ أُحضر بحد +1 لكشف وجود التالي. */
export function buildPage<T extends { id: string }>(
  rows: T[],
  limit: number,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
