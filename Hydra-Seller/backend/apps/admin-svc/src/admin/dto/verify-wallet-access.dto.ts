import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyWalletAccessDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
