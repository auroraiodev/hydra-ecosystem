import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  IsObject,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @ApiPropertyOptional({
    description: 'Local product ID (required if isImportation is false)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  singleId?: string;

  @ApiProperty({
    description: 'Quantity of items to add',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Whether the product is from Importation source',
    example: false,
    default: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isImportation: boolean;

  @ApiPropertyOptional({
    description: 'Importation product ID (required if isImportation is true)',
    example: '135764',
  })
  @IsOptional()
  @IsString()
  importationId?: string;

  @ApiPropertyOptional({
    description:
      'Product data (required only for Importation products, should contain at least: name, importationId, language, foil)',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  productData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'TCG ID associated with the product',
    example: 'bd789d3f-5569-4971-890e-e261e145e42c',
  })
  @IsOptional()
  @IsString()
  tcgId?: string;
}
