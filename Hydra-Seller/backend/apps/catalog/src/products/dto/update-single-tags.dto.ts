import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateSingleTagsDto {
  @ApiProperty({ description: 'Tag names', type: [String], example: ['Mint', 'Foil'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
