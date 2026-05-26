import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUUID } from 'class-validator';

export class CreateBundleDto {
  @ApiProperty({ description: 'Borderless flag', example: false })
  @IsBoolean()
  borderless: boolean;

  @ApiProperty({ description: 'Card name', example: 'My Bundle' })
  @IsString()
  cardName: string;

  @ApiProperty({ description: 'Card number', example: '000' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Category ID (UUID)', example: 'uuid-here' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ description: 'Condition ID (UUID)', example: 'uuid-here', required: false })
  @IsOptional()
  @IsUUID()
  condition_id?: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'A great bundle of cards.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Expansion code', example: 'BND' })
  @IsString()
  expansion: string;

  @ApiProperty({ description: 'Extended art flag', example: false })
  @IsBoolean()
  extendedArt: boolean;

  @ApiProperty({ description: 'Final price in MXN', example: 500 })
  @IsNumber()
  finalPrice: number;

  @ApiProperty({ description: 'Foil flag', example: false })
  @IsBoolean()
  foil: boolean;

  @ApiProperty({ description: 'Importation product ID', example: '' })
  @IsString()
  importationId: string;

  @ApiPropertyOptional({ description: 'Additional images', type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/bundle.jpg',
  })
  @IsString()
  img: string;

  @ApiProperty({ description: 'Is local inventory flag', example: true })
  @IsBoolean()
  isLocalInventory: boolean;

  @ApiProperty({ description: 'Language ID (UUID)', example: 'uuid-here', required: false })
  @IsOptional()
  @IsUUID()
  language_id?: string;

  @ApiProperty({
    description: 'Importation link',
    example: '',
  })
  @IsString()
  link: string;

  @ApiPropertyOptional({ description: 'Metadata array', type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metadata?: string[];

  @ApiProperty({ description: 'Owner user ID (UUID)', example: 'uuid-here' })
  @IsUUID()
  owner_id: string;

  @ApiProperty({ description: 'Prerelease flag', example: false })
  @IsBoolean()
  prerelease: boolean;

  @ApiProperty({ description: 'Premier play flag', example: false })
  @IsBoolean()
  premierPlay: boolean;

  @ApiProperty({ description: 'Formatted price string', example: '$500.00 MXN' })
  @IsString()
  price: string;

  @ApiProperty({ description: 'Stock count', example: 1 })
  @IsNumber()
  stock: number;

  @ApiProperty({ description: 'Surge foil flag', example: false })
  @IsBoolean()
  surgeFoil: boolean;

  @ApiPropertyOptional({ description: 'Tags array', type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Variant',
    example: 'Special Edition',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  variant?: string | null;

  @ApiPropertyOptional({
    description: 'TCG ID (UUID). If not provided, defaults to Magic',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  tcg_id?: string;
}
