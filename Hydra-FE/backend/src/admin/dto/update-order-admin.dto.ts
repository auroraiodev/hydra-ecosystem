import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum AdminOrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export class UpdateOrderAdminDto {
  @ApiPropertyOptional({ enum: AdminOrderStatus })
  @IsEnum(AdminOrderStatus)
  @IsOptional()
  status?: AdminOrderStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: AdminOrderPriority })
  @IsEnum(AdminOrderPriority)
  @IsOptional()
  priority?: AdminOrderPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
