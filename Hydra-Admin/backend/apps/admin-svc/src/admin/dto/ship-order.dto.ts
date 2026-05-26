import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShipOrderDto {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @ApiPropertyOptional({ description: 'Shipping carrier' })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsString()
  @IsOptional()
  estimatedDelivery?: string;

  @ApiPropertyOptional({ description: 'Notify customer about shipment' })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean;
}
