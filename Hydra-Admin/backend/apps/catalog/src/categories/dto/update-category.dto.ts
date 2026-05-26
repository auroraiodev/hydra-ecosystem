import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsArray,
  IsObject,
  Matches,
} from 'class-validator';
import { Expose } from 'class-transformer';

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category code/name (e.g., SINGLES, BOOSTER, BOOSTER_BOX)',
    example: 'SINGLES',
  })
  @IsString()
  @IsOptional()
  @Expose()
  name?: string;

  @ApiPropertyOptional({
    description: 'User-friendly display name',
    example: 'Singles',
  })
  @IsString()
  @IsOptional()
  @Expose()
  display_name?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Una carta individual',
  })
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Expose()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Expose()
  order?: number;

  @ApiPropertyOptional({
    description: 'Dynamic form configuration (JSON)',
    example: { fields: { foil: { enabled: true }, condition: { enabled: true } } },
  })
  @IsObject()
  @IsOptional()
  @Expose()
  form_config?: any;

  @ApiPropertyOptional({
    description: 'URL for the category image',
    example: 'https://cdn.example.com/images/singles.png',
  })
  @IsString()
  @IsOptional()
  @Expose()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Per-TCG display name overrides (tcgId → label)',
    example: { 'uuid-pkmn': 'Mazos', 'uuid-mtg': 'Commander Decks' },
  })
  @IsObject()
  @IsOptional()
  @Expose()
  tcg_display_names?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'TCG IDs this category belongs to',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @Matches(UUID_LIKE, { each: true, message: 'each value in tcg_ids must be a UUID' })
  @IsOptional()
  @Expose()
  tcg_ids?: string[];
}
