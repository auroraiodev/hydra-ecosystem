import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  USERS = 'users',
  PRODUCTS = 'products',
}

export class TriggerBackupDto {
  @ApiProperty({ enum: BackupType })
  @IsEnum(BackupType)
  @IsNotEmpty()
  type: BackupType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeFiles?: boolean;
}
