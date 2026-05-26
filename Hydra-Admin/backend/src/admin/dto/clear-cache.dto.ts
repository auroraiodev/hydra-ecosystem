import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClearCacheDto {
  @ApiPropertyOptional({ description: 'Cache pattern to clear (optional)' })
  @IsString()
  @IsOptional()
  pattern?: string;
}
