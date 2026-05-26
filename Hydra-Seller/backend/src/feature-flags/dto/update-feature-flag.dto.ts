import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeatureFlagDto {
  @ApiProperty({ description: 'New enabled state' })
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
