import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateTcgDto {
  @ApiProperty({
    description: 'TCG name (e.g., Magic, Pokemon, Yugi, One piece)',
    example: 'Magic',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'User-friendly display name',
    example: 'Magic: The Gathering',
  })
  @IsString()
  @MinLength(1)
  display_name: string;

  @ApiPropertyOptional({
    description: 'Whether the TCG is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Logo URL (full logo)',
    example: 'https://example.com/magic-logo.png',
  })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Icon URL (small icon)',
    example: 'https://example.com/magic-icon.png',
  })
  @IsString()
  @IsOptional()
  icon_url?: string;

  @ApiPropertyOptional({
    description: 'Loader URL (custom loader animation image)',
    example: 'https://example.com/magic-loader.png',
  })
  @IsString()
  @IsOptional()
  loader_url?: string;

  @ApiPropertyOptional({
    description: 'Order weight for sorting',
    example: 0,
    default: 0,
  })
  @IsOptional()
  order?: number;
}
