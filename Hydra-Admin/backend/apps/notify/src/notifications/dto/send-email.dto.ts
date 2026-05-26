import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailTarget {
  PURCHASE_ADMIN = 'purchase-admin',
  PURCHASE_CUSTOMER = 'purchase-customer',
  PAYMENT_ADMIN = 'payment-admin',
  PAYMENT_CUSTOMER = 'payment-customer',
  CHAT_ALERT = 'chat-alert',
}

class EmailItem {
  @ApiProperty({ description: 'Item name', example: 'Pokemon Card - Charizard' })
  name: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: '250.00' })
  price: string;
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Email template target',
    enum: EmailTarget,
    example: EmailTarget.PURCHASE_CUSTOMER,
  })
  @IsEnum(EmailTarget)
  target: EmailTarget;

  @ApiPropertyOptional({ description: 'Order UUID', example: 'ord_abc123' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Customer full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email address', example: 'john@example.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Total order amount', example: '1250.00' })
  @IsOptional()
  @IsString()
  totalAmount?: string;

  @ApiPropertyOptional({
    description: 'Line items in the order',
    type: [EmailItem],
    example: [{ name: 'Pokemon Card - Charizard', quantity: 1, price: '250.00' }],
  })
  @IsOptional()
  @IsArray()
  items?: Array<{ name: string; quantity: number; price: string }>;

  @ApiPropertyOptional({ description: 'Payment method description', example: 'Credit card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Shipping method', example: 'DHL Express' })
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiPropertyOptional({ description: 'Name of the chat sender', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  chatSender?: string;

  @ApiPropertyOptional({
    description: 'Content of the chat message',
    example: 'Hola, tengo una duda...',
  })
  @IsOptional()
  @IsString()
  chatMessage?: string;
}
