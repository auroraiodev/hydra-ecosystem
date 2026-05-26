import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeliveryStatusDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDelivered?: boolean;

  @ApiPropertyOptional({ description: 'Number of units to deliver (for partial delivery)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  deliveredQuantity?: number;

  @ApiPropertyOptional({
    description: 'Tracking status for the item',
    enum: ['pending', 'importing', 'ready', 'sold'],
  })
  @IsString()
  @IsIn(['pending', 'importing', 'ready', 'sold'])
  @IsOptional()
  status?: string;
}
