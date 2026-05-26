import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  MinLength,
  IsArray,
  IsObject,
  Matches,
} from 'class-validator';

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category code/name (e.g., SINGLES, BOOSTER, BOOSTER_BOX)',
    example: 'SINGLES',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'User-friendly display name',
    example: 'Singles',
  })
  @IsString()
  @MinLength(1)
  display_name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Una carta individual',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({
    description: 'Display order',
    example: 1,
  })
  @IsInt()
  order: number;

  @ApiPropertyOptional({
    description: 'Dynamic form configuration (JSON)',
    example: { fields: { foil: { enabled: true }, condition: { enabled: true } } },
  })
  @IsObject()
  @IsOptional()
  form_config?: any;

  @ApiPropertyOptional({
    description: 'URL for the category image',
    example: 'https://cdn.example.com/images/singles.png',
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'TCG IDs this category belongs to',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @Matches(UUID_LIKE, { each: true, message: 'each value in tcg_ids must be a UUID' })
  @IsOptional()
  tcg_ids?: string[];
}
