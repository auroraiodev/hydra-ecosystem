import { IsEnum, IsString, IsOptional, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  TRANSFER = 'transfer',
  MERCADOPAGO = 'mercadopago',
  WALLET = 'wallet',
  GOOGLEPAY = 'googlepay',
  WALLET_PLUS_MERCADOPAGO = 'wallet_plus_mercadopago',
  WALLET_PLUS_TRANSFER = 'wallet_plus_transfer',
}

export enum ShippingMethod {
  ARRANGE = 'arrange',
  SHIPPING = 'shipping',
}

export class CreateOrderDto {
  @ApiProperty({
    enum: ShippingMethod,
    description: 'Shipping method: arrange (with seller) or shipping (to address)',
  })
  @IsEnum(ShippingMethod)
  @IsNotEmpty()
  shippingMethod: ShippingMethod;

  @ApiProperty({
    required: false,
    description: 'Address ID (required if shippingMethod is shipping)',
  })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    required: false,
    description: 'Phone number for order updates',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method: transfer, mercadopago, wallet or googlepay',
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    required: false,
    description: 'Payment token for Google Pay (required if paymentMethod is googlepay)',
  })
  @IsString()
  @IsOptional()
  paymentToken?: string;

  @ApiProperty({
    required: false,
    description:
      'Amount to pay from wallet balance (required for wallet_plus_mercadopago and wallet_plus_transfer)',
    example: 100.0,
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  walletAmount?: number;

  @ApiProperty({
    required: false,
    description:
      'List of cart item IDs to include in the order (if empty, all items will be included)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  itemIds?: string[];
}
