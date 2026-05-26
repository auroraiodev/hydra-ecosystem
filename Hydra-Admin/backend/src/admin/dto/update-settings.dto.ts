import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  site_name?: any;

  @ApiPropertyOptional()
  @IsOptional()
  admin_email?: any;

  @ApiPropertyOptional()
  @IsOptional()
  support_email?: any;

  @ApiPropertyOptional()
  @IsOptional()
  max_products_per_page?: any;

  @ApiPropertyOptional()
  @IsOptional()
  tax_rate?: any;

  @ApiPropertyOptional()
  @IsOptional()
  shipping_cost?: any;

  @ApiPropertyOptional()
  @IsOptional()
  enable_notifications?: any;

  @ApiPropertyOptional()
  @IsOptional()
  enable_two_factor?: any;

  @ApiPropertyOptional()
  @IsOptional()
  importTaxRate?: any;

  @ApiPropertyOptional()
  @IsOptional()
  profitRate?: any;

  @ApiPropertyOptional()
  @IsOptional()
  importation_fixed_fee?: any;

  @ApiPropertyOptional()
  @IsOptional()
  site_logo?: any;

  @ApiPropertyOptional()
  @IsOptional()
  site_loader?: any;

  @ApiPropertyOptional()
  @IsOptional()
  contact_phone?: any;

  @ApiPropertyOptional()
  @IsOptional()
  marketplace_name?: any;

  @ApiPropertyOptional()
  @IsOptional()
  platform_fee?: any;

  @ApiPropertyOptional()
  @IsOptional()
  mp_fee_rate?: any;
}
