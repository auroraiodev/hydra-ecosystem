import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AddCartItemDto } from './add-cart-item.dto.js';

export class MergeCartItemsDto {
  @ApiProperty({
    description: 'List of items to merge into the user cart',
    type: [AddCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}
