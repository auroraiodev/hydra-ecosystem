import { ApiProperty } from '@nestjs/swagger';

export class CartSummaryDto {
  @ApiProperty({ description: 'Subtotal before fees and shipping' })
  subtotal: number;

  @ApiProperty({ description: 'Shipping cost' })
  shipping: number;

  @ApiProperty({ description: 'Import fee for Importation items' })
  importFee: number;

  @ApiProperty({ description: 'Additional fee for payment method (if applicable)' })
  paymentFee: number;

  @ApiProperty({ description: 'Final total amount' })
  total: number;

  @ApiProperty({ description: 'Number of items in cart' })
  itemCount: number;

  @ApiProperty({ description: 'Indicates if cart has Importation items requiring import fee' })
  hasImportItems: boolean;
}
