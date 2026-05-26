import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddOrderItemDto {
  @ApiProperty({
    description: 'ID of the product (Single ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  singleId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Whether the item is from Importation (optional, default false)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isImportation?: boolean;

  @ApiProperty({
    description: 'Card name for Importation lookup optimization',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardName?: string;

  @ApiProperty({
    description:
      'Product data (fallback if live lookup fails). Should contain: name, price, imageUrl, url, stock, etc.',
    type: Object,
    required: false,
  })
  @IsOptional()
  productData?: Record<string, any>;
}
