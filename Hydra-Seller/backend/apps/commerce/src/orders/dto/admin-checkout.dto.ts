import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdminCheckoutPaymentMethod {
  WALLET = 'wallet',
  MERCADOPAGO = 'mercadopago',
}

export enum AdminCheckoutShippingMethod {
  PICKUP = 'pickup',
  SHIPPING = 'shipping',
}

export class AdminCheckoutDto {
  @ApiProperty({ enum: AdminCheckoutShippingMethod })
  @IsEnum(AdminCheckoutShippingMethod)
  @IsNotEmpty()
  shippingMethod: AdminCheckoutShippingMethod;

  @ApiProperty({ enum: AdminCheckoutPaymentMethod })
  @IsEnum(AdminCheckoutPaymentMethod)
  @IsNotEmpty()
  paymentMethod: AdminCheckoutPaymentMethod;
}
