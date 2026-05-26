import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  LISTING_STATUS = 'LISTING_STATUS',
  ITEM_DELIVERY = 'ITEM_DELIVERY',
  WALLET_TX = 'WALLET_TX',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  ADMIN_ALERT = 'ADMIN_ALERT',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'UUID of the target user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.ORDER_STATUS,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title', example: 'Order #1234 shipped' })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body text',
    example: 'Your order has been shipped and is on its way.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata payload',
    example: { orderId: '1234', status: 'shipped' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether to also send a push notification',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

export class NotifyAdminsDto {
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.ADMIN_ALERT,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title', example: 'System alert' })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body text',
    example: 'A critical error occurred in the payment pipeline.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata payload',
    example: { severity: 'critical', source: 'payments' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
