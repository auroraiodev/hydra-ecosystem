import {
  IsEnum,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod, ShippingMethod } from './create-order.dto.js';

class OrderItemDto {
  @ApiProperty({ description: 'ID of the product (Single ID or Importation ID)' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price (optional override)', required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ description: 'Is Importation product?', required: false })
  @IsOptional()
  isImportation?: boolean;
}

export class AdminCreateOrderDto {
  @ApiProperty({ description: 'User ID to create order for' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ type: [OrderItemDto], description: 'Items to add to order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    enum: ShippingMethod,
    description: 'Shipping method',
  })
  @IsEnum(ShippingMethod)
  @IsNotEmpty()
  shippingMethod: ShippingMethod;

  @ApiProperty({
    required: false,
    description: 'Address ID',
  })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
