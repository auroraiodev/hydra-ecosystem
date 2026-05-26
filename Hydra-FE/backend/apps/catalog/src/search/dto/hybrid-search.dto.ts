import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class HybridSearchDto {
  @ApiProperty({
    description: 'Search query (card name)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiProperty({
    description: 'Page number (default: 1)',
    required: false,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of results per page (default: 12)',
    required: false,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Filter by conditions (comma-separated IDs)',
    required: false,
  })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiProperty({
    description: 'Filter by languages (comma-separated codes)',
    required: false,
  })
  @IsOptional()
  @IsString()
  languages?: string;

  @ApiProperty({
    description: 'Filter by foil status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsString()
  foil?: string;

  @ApiProperty({
    description: 'Filter by in stock status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsString()
  inStock?: string;

  @ApiProperty({
    description: 'Filter by minimum price',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum price',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    description: 'Filter by card expansions (sets), comma-separated',
    required: false,
  })
  @IsOptional()
  @IsString()
  expansions?: string;

  @ApiProperty({
    description: 'Filter by TCG ID (defaults to Magic: The Gathering)',
    required: false,
  })
  @IsOptional()
  @IsString()
  tcgId?: string;
}
