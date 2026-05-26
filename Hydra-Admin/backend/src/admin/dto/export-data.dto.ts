import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExportType {
  USERS = 'users',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
}

export class ExportDataDto {
  @ApiPropertyOptional({ enum: ExportType })
  @IsEnum(ExportType)
  @IsOptional()
  type?: ExportType;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateTo?: Date;
}
