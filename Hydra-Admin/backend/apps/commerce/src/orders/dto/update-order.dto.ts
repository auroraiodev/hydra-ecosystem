import { IsArray, IsEnum, IsOptional, IsString, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class TrackingEntryDto {
  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  origin: string;

  @ApiProperty()
  @IsString()
  event: string;
}

export class UpdateOrderDto {
  @ApiProperty({
    enum: OrderStatus,
    required: false,
    description: 'New order status',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  estimatedDelivery?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  estimatedDeliveryAt?: string | null;

  @ApiProperty({ required: false })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  arrivedAt?: string | null;

  @ApiProperty({ required: false })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  deliveredAt?: string | null;

  @ApiProperty({ required: false, description: 'Date when Importation import was ordered' })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  importOrderedAt?: string | null;

  @ApiProperty({ required: false, description: 'Internal order reference number' })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  internalOrderNumber?: string | null;

  @ApiProperty({ required: false, description: 'Internal admin notes for this order' })
  @ValidateIf((o, v) => v !== null)
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiProperty({
    required: false,
    type: [TrackingEntryDto],
    description: 'Structured tracking entries',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingEntryDto)
  @IsOptional()
  trackingEntries?: TrackingEntryDto[];
}
