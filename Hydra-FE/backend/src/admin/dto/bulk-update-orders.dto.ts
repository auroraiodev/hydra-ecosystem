import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkUpdateOrdersDto {
  @ApiProperty({ type: [String], description: 'Order IDs to update' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  orderIds: string[];

  @ApiProperty({ type: Object, description: 'Fields to update' })
  @IsObject()
  @IsNotEmpty()
  updates: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object, description: 'Filter criteria' })
  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;
}
