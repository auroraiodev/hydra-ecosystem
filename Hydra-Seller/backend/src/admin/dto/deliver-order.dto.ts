import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeliverOrderDto {
  @ApiPropertyOptional({ description: 'Actual delivery date' })
  @IsString()
  @IsOptional()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Delivery notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Notify customer about delivery' })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean;
}
