import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;
}
