import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  WALLET = 'wallet',
  MERCADOPAGO = 'mercadopago',
}

export enum ShippingMethod {
  PICKUP = 'pickup',
  SHIPPING = 'shipping',
}

export class AdminCheckoutDto {
  @ApiProperty({ enum: ShippingMethod })
  @IsEnum(ShippingMethod)
  @IsNotEmpty()
  shippingMethod: ShippingMethod;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
