import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, IsUUID, MinLength } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({
    description: 'Banner title',
    example: 'Encuentra las mejores Singles de Magic',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({
    description: 'Banner subtitle',
    example: 'Singles de Magic',
  })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Banner description',
    example: 'Explora miles de cartas con entrega inmediata...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Desktop image URL',
    example: '/banners/desktop/1.jpg',
  })
  @IsString()
  desktop_image: string;

  @ApiPropertyOptional({
    description: 'Mobile image URL',
    example: '/banners/mobile/1.png',
  })
  @IsString()
  @IsOptional()
  mobile_image?: string;

  @ApiPropertyOptional({
    description: 'Text for the main action button',
    example: 'Explorar Singles',
  })
  @IsString()
  @IsOptional()
  button_text?: string;

  @ApiPropertyOptional({
    description: 'Link for the main action button',
    example: '/singles/search',
  })
  @IsString()
  @IsOptional()
  button_link?: string;

  @ApiPropertyOptional({
    description: 'Whether the banner is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Order weight for sorting',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'Associated TCG ID',
  })
  @IsUUID()
  @IsOptional()
  tcg_id?: string;
}
