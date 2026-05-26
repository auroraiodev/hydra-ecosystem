import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustWalletBalanceDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isCredit: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
