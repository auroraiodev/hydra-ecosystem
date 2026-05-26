import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnsubscribePushDto {
  @ApiProperty({ description: 'Push subscription endpoint URL' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}
