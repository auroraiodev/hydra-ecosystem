import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUUID } from 'class-validator';

export class CreateSingleDto {
  @ApiProperty({ description: 'Borderless flag', example: false })
  @IsBoolean()
  borderless: boolean;

  @ApiProperty({ description: 'Card name', example: 'Ral, Storm Conduit' })
  @IsString()
  cardName: string;

  @ApiProperty({ description: 'Card number', example: '211' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Category ID (UUID)', example: 'uuid-here' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ description: 'Condition ID (UUID)', example: 'uuid-here' })
  @IsUUID()
  condition_id: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'A great bundle of cards.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Expansion code', example: 'WAR' })
  @IsString()
  expansion: string;

  @ApiProperty({ description: 'Extended art flag', example: false })
  @IsBoolean()
  extendedArt: boolean;

  @ApiProperty({ description: 'Final price in MXN', example: 30 })
  @IsNumber()
  finalPrice: number;

  @ApiProperty({ description: 'Foil flag', example: false })
  @IsBoolean()
  foil: boolean;

  @ApiProperty({ description: 'Importation product ID', example: '166212' })
  @IsString()
  importationId: string;

  @ApiPropertyOptional({ description: 'Additional images', type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Image URL',
    example: 'https://files.importationmtg.com/img/goods/L/The_List/WAR-211.jpg',
  })
  @IsString()
  img: string;

  @ApiProperty({ description: 'Is local inventory flag', example: false })
  @IsBoolean()
  isLocalInventory: boolean;

  @ApiProperty({ description: 'Language ID (UUID)', example: 'uuid-here' })
  @IsUUID()
  language_id: string;

  @ApiProperty({
    description: 'Importation link',
    example: 'https://www.importationmtg.com/en/products/detail/166212?lang=EN',
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

  @ApiProperty({ description: 'Stock count', example: 0 })
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
    description: 'Variant (set name)',
    example: 'The List',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  variant?: string | null;

  @ApiPropertyOptional({ description: 'Serialized flag', example: false })
  @IsOptional()
  @IsBoolean()
  isSerialized?: boolean;

  @ApiPropertyOptional({ description: 'Alternate frame flag', example: false })
  @IsOptional()
  @IsBoolean()
  isAlternateFrame?: boolean;

  @ApiPropertyOptional({ description: 'Showcase flag', example: false })
  @IsOptional()
  @IsBoolean()
  isShowcase?: boolean;

  @ApiPropertyOptional({ description: 'Price in MXN (Importation)', example: 100.5 })
  @IsOptional()
  @IsNumber()
  priceMxnImportation?: number;

  @ApiPropertyOptional({ description: 'Price in MXN (Local)', example: 80.25 })
  @IsOptional()
  @IsNumber()
  priceMxnLocal?: number;

  @ApiPropertyOptional({
    description: 'TCG ID (UUID). If not provided, defaults to Magic',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  tcg_id?: string;
}
