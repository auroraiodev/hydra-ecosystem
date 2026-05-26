import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderPayoutRequestDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  orderIds: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  details: string;
}
