import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingMethod } from './create-order.dto.js';

export class CheckoutTotalsDto {
  @ApiProperty({
    enum: ShippingMethod,
    description: 'Shipping method: arrange (with seller) or shipping (to address)',
  })
  @IsEnum(ShippingMethod)
  @IsNotEmpty()
  shippingMethod: ShippingMethod;

  @ApiProperty({
    required: false,
    description:
      'List of cart item IDs to include in the calculation (if empty, all items will be included)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  itemIds?: string[];
}

export class CheckoutItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  total: number;
}

export class CheckoutTotalsResponseDto {
  @ApiProperty({ type: [CheckoutItemResponseDto] })
  items: CheckoutItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  importFee: number;

  @ApiProperty()
  total: number;
}
