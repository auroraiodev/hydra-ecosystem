import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Refund amount (if applicable)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Notify customer about cancellation' })
  @IsBoolean()
  @IsOptional()
  notifyCustomer?: boolean;
}
